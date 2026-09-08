import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types";
import { NEW_ARRIVALS } from "@/data/newArrivals";
import {
  transformProductToDesignStrict,
  normalizeProductColors,
  normalizeProductSizes,
  normalizeCatalogPrice,
  DesignVM,
} from "@/lib/adapters/productAdapter";

export function useCatalogProducts() {
  return useQuery({
    queryKey: ["catalog-products"],
    queryFn: async (): Promise<{ rawProducts: Product[]; designs: DesignVM[] }> => {
      try {
        const { data: dbRows, error } = await supabase
          .from("products")
          .select("*")
          .in("status", ["live", "submitted"])
          .eq("is_available", true);

        if (error) {
          console.error("[useCatalogProducts] Supabase error:", error.message);
          return { rawProducts: [], designs: [] };
        }

        const dbProducts: Product[] = (dbRows || []).map((p: any) => {
          const { price, originalPrice } = normalizeCatalogPrice(p.price, p.id || p.title, p.category);

          return {
            id: String(p.id),
            name: p.title || "Artisanal Creation",
            brand: p.brand || "OGURA Atelier",
            price,
            originalPrice,
            category: (p.category || "dresses") as Product["category"],
            images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ["/placeholder.svg"],
            sizes: normalizeProductSizes(p.sizes),
            colors: normalizeProductColors(p.colors),
            description: p.description || "",
            material: p.material || p.fabric || "Pure silk / handloom textile",
            inStock: p.is_available ?? true,
            tags: Array.isArray(p.style_tags) ? p.style_tags : [],
            occasions: Array.isArray(p.occasion_tags) ? p.occasion_tags : [],
            rating: 4.9,
            reviews: 16,
          };
        });

        // Deduplicate by ID
        const seen = new Set<string>();
        const deduplicated: Product[] = [];
        for (const prod of dbProducts) {
          if (!seen.has(prod.id)) {
            seen.add(prod.id);
            deduplicated.push(prod);
          }
        }

        // The 9 Sept studio drop lives in code, not the products table, so the
        // catalogue can carry it without a production database write.
        for (const seed of NEW_ARRIVALS) {
          if (seen.has(seed.id)) continue;
          seen.add(seed.id);
          const { price, originalPrice } = normalizeCatalogPrice(undefined, seed.id, seed.category);
          deduplicated.push({
            id: seed.id,
            name: seed.title,
            brand: seed.brand,
            price,
            originalPrice,
            category: seed.category as Product["category"],
            images: seed.images,
            sizes: normalizeProductSizes(seed.sizes),
            colors: normalizeProductColors(seed.colors),
            description: seed.description,
            material: seed.fabric,
            inStock: true,
            tags: seed.style_tags,
            occasions: seed.occasion_tags,
            rating: 5.0,
            reviews: 0,
          });
        }

        // Merge any real-time locally added seller products
        if (typeof window !== "undefined") {
          try {
            const localCustom = localStorage.getItem("ogura_custom_catalog_products");
            if (localCustom) {
              const customItems = JSON.parse(localCustom);
              if (Array.isArray(customItems)) {
                for (const cp of customItems) {
                  const idStr = String(cp.id);
                  if (!seen.has(idStr)) {
                    const { price: customPrice, originalPrice: customOriginalPrice } = normalizeCatalogPrice(cp.price, idStr || cp.title, cp.category);
                    deduplicated.push({
                      id: idStr,
                      name: cp.title || "Artisanal Creation",
                      brand: cp.brand || "OGURA Atelier",
                      price: customPrice,
                      originalPrice: customOriginalPrice,
                      category: (cp.category || "dresses") as Product["category"],
                      images: Array.isArray(cp.images) && cp.images.length > 0 ? cp.images : ["/placeholder.svg"],
                      sizes: normalizeProductSizes(cp.sizes),
                      colors: normalizeProductColors(cp.colors),
                      description: cp.description || "",
                      material: cp.material || cp.fabric || "Pure silk / handloom textile",
                      inStock: true,
                      tags: Array.isArray(cp.style_tags) ? cp.style_tags : [],
                      occasions: Array.isArray(cp.occasion_tags) ? cp.occasion_tags : [],
                      rating: 5.0,
                      reviews: 1,
                    });
                  }
                }
              }
            }
          } catch {}
        }

        // Tops and Indian Co-ords lead the catalogue: this drop is the work that
        // looks most like what Ogura actually sells. Everything else keeps the
        // existing cheapest-first order behind them.
        // Tops and Indian Co-ords lead, and inside them the 9 Sept studio drop
        // comes first — that photography is the closest thing on the site to
        // what Ogura actually sells. Mirrors featuredRank() in Collections.tsx.
        const featuredRank = (item: { category?: string; images?: string[]; image?: string }) => {
          const c = (item.category || "").toLowerCase();
          const firstImage = item.image ?? item.images?.[0] ?? "";
          const isDrop = firstImage.startsWith("/catalogue/");
          const isTop = c.includes("top");
          const isCoord = c.includes("kurta set") || c.includes("indian co");
          if (isDrop && isCoord) return 0;
          if (isDrop && isTop) return 1;
          if (isCoord) return 2;
          if (isTop) return 3;
          return 4;
        };

        const byFeatureThenPrice = <
          T extends { category?: string; price: number; images?: string[]; image?: string },
        >(a: T, b: T) => featuredRank(a) - featuredRank(b) || a.price - b.price;

        deduplicated.sort(byFeatureThenPrice);

        const designs = deduplicated
          .map((p) => transformProductToDesignStrict(p))
          .sort(byFeatureThenPrice);

        return {
          rawProducts: deduplicated,
          designs,
        };
      } catch (err) {
        console.error("[useCatalogProducts] Unexpected error loading real catalog:", err);
        return { rawProducts: [], designs: [] };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
