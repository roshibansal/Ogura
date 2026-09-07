import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types";
import {
  transformProductToDesignStrict,
  normalizeProductColors,
  normalizeProductSizes,
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
          const authoritativePrice =
            typeof p.price === "number" && p.price > 0 ? p.price : 0;

          return {
            id: String(p.id),
            name: p.title || "Artisanal Creation",
            brand: p.brand || "OGURA Atelier",
            price: authoritativePrice,
            originalPrice: p.original_price ? Number(p.original_price) : Math.round(authoritativePrice * 1.3),
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
                    seen.add(idStr);
                    deduplicated.push({
                      id: idStr,
                      name: cp.title || "Artisanal Creation",
                      brand: cp.brand || "OGURA Atelier",
                      price: Number(cp.price) || 0,
                      originalPrice: cp.original_price ? Number(cp.original_price) : Math.round((Number(cp.price) || 0) * 1.3),
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

        // Default sort: cheapest to expensive (lowest to highest price)
        deduplicated.sort((a, b) => a.price - b.price);

        const designs = deduplicated
          .map((p) => transformProductToDesignStrict(p))
          .sort((a, b) => a.price - b.price);

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
