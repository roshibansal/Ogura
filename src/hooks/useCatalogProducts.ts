import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { products as staticProducts } from "@/data/products";
import { Product } from "@/types";
import { transformProductToDesignStrict, getUniformProductPrice, normalizeProductColors, normalizeProductSizes, DesignVM } from "@/lib/adapters/productAdapter";

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
          console.warn("[useCatalogProducts] DB fetch warning:", error.message);
        }

        const dbProducts: Product[] = (dbRows || []).map((p: any) => {
          const price = getUniformProductPrice(String(p.id));
          return {
            id: String(p.id),
            name: p.title || "Artisanal Piece",
            brand: p.brand || "OGURA Atelier",
            price,
            originalPrice: p.original_price ? Math.round(price * 1.3) : undefined,
            category: (p.category || "dresses") as Product["category"],
            images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ["/placeholder.svg"],
            sizes: normalizeProductSizes(p.sizes),
            colors: normalizeProductColors(p.colors),
            description: p.description || "",

            material: p.material || p.fabric || "Pure silk / handloom",
            inStock: p.is_available ?? true,
            tags: Array.isArray(p.style_tags) ? p.style_tags : [],
            occasions: Array.isArray(p.occasion_tags) ? p.occasion_tags : [],
            rating: 4.8,
            reviews: 12,
          };
        });

        // Merge real DB products first, followed by static production catalog products
        const combined = [...dbProducts, ...staticProducts];
        
        // Deduplicate by ID
        const seen = new Set<string>();
        const deduplicated: Product[] = [];
        for (const prod of combined) {
          if (!seen.has(prod.id)) {
            seen.add(prod.id);
            deduplicated.push(prod);
          }
        }

        // Default sort cheapest to expensive (lowest to highest price)
        deduplicated.sort((a, b) => a.price - b.price);

        const designs = deduplicated
          .map((p) => transformProductToDesignStrict(p))
          .sort((a, b) => a.price - b.price);

        return {
          rawProducts: deduplicated,
          designs,
        };
      } catch (err) {
        console.error("[useCatalogProducts] Failed to load products, using fallback", err);
        const designs = staticProducts.map((p) => transformProductToDesignStrict(p));
        return {
          rawProducts: staticProducts,
          designs,
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
