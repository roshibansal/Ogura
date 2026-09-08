import type { Product } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { normalizeCatalogPrice } from "@/lib/adapters/productAdapter";

export interface BrandStoreProduct extends Product {
  storeName?: string;
  storeSlug?: string;
  videoUrl?: string;
}

export interface BrandStore {
  name: string;
  slug: string;
  productCount: number;
  coverImages: string[];
  products: BrandStoreProduct[];
}

export const slugifyBrand = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const mapApiProduct = (p: any, i: number): BrandStoreProduct => {
  const storeName: string | undefined = p?.store?.name ?? p?.brand ?? undefined;
  const storeSlug = p?.store?.slug ?? (storeName ? slugifyBrand(storeName) : undefined);
  const images: string[] = Array.isArray(p?.image_urls) && p.image_urls.length
    ? p.image_urls
    : p?.image_url
    ? [p.image_url]
    : Array.isArray(p?.images) && p.images.length
    ? p.images
    : ["/placeholder.svg"];

  const idStr = String(p?.id ?? `api-${i}`);
  const { price, originalPrice } = normalizeCatalogPrice(p?.price, idStr || p?.name);

  return {
    id: idStr,
    name: p?.name ?? p?.title ?? "Untitled",
    brand: storeName ?? "OGURA",
    price,
    originalPrice,
    category: (p?.category as Product["category"]) ?? "accessories",
    images,
    tags: p?.tags ?? [],
    sizes: p?.sizes ?? [],
    colors: p?.colors ?? [],
    rating: 0,
    reviews: 0,
    inStock: p?.stock == null ? true : Number(p.stock) > 0,
    description: p?.description ?? "",
    material: p?.material ?? "",
    occasions: [],
    storeName,
    storeSlug,
    videoUrl: p?.video_url ?? undefined,
  };
};

/** Fetch all live seller products from the OGURA database. */
export const fetchSellerProducts = async (): Promise<BrandStoreProduct[]> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, title, price, original_price, category, images, sizes, colors, description, material, is_available, brand, seller:sellers!products_seller_id_fkey(brand_name)"
      )
      .eq("status", "live")
      .eq("is_available", true)
      .not("seller_id", "is", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((p: any, i: number) => {
      const storeName: string | undefined = p?.seller?.brand_name ?? p?.brand ?? undefined;
      return mapApiProduct(
        {
          id: p.id,
          name: p.title,
          brand: storeName,
          store: storeName ? { name: storeName, slug: slugifyBrand(storeName) } : undefined,
          price: p.price,
          mrp: p.original_price,
          category: p.category,
          image_urls: Array.isArray(p.images) ? p.images : [],
          sizes: Array.isArray(p.sizes) ? p.sizes : [],
          colors: Array.isArray(p.colors) ? p.colors : [],
          description: p.description,
          material: p.material,
        },
        i
      );
    });
  } catch (err) {
    console.error("[brandStores] failed to fetch seller products:", err);
    return [];
  }
};

/** Group seller products into brand stores. */
export const groupIntoBrandStores = (items: BrandStoreProduct[]): BrandStore[] => {
  const map = new Map<string, BrandStore>();

  items.forEach((product) => {
    if (!product.storeName || !product.storeSlug) return;
    const existing = map.get(product.storeSlug);
    if (existing) {
      existing.products.push(product);
      existing.productCount += 1;
      if (existing.coverImages.length < 4 && product.images[0]) {
        existing.coverImages.push(product.images[0]);
      }
    } else {
      map.set(product.storeSlug, {
        name: product.storeName,
        slug: product.storeSlug,
        productCount: 1,
        coverImages: product.images[0] ? [product.images[0]] : [],
        products: [product],
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => b.productCount - a.productCount);
};

export const fetchBrandStores = async (): Promise<BrandStore[]> =>
  groupIntoBrandStores(await fetchSellerProducts());
