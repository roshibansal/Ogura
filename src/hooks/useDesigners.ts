import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Designer } from "@/types";
import { applyBoutiqueOverride } from "@/data/boutiqueOverrides";
import { sellerToBoutique, SellerRow } from "@/lib/adapters/sellerToBoutique";

export const useDesigners = (filters?: { search?: string; category?: string }) => {
  return useQuery({
    queryKey: ['designers', filters],
    queryFn: async () => {
      // Boutiques come from `sellers`, not `designers`. Every product carries a
      // seller_id (311/311) and no product has a designer_id, so listing
      // designers gave boutique pages with no designs in them.
      let query = supabase
        .from('sellers')
        .select('id, brand_name, city, description, profile_image, banner_image, instagram_handle, seller_type, is_verified, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(`brand_name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((row) =>
        applyBoutiqueOverride(sellerToBoutique(row as SellerRow)),
      ) as Designer[];
    },
  });
};

export const useDesigner = (id: string) => {
  return useQuery({
    queryKey: ['designer', id],
    queryFn: async () => {
      if (!id) return null;

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      // 1. Sellers first — these are the boutiques the listing shows, and the
      //    only ones with products behind them.
      let sFirst = supabase
        .from('sellers')
        .select('id, brand_name, city, description, profile_image, banner_image, instagram_handle, seller_type, is_verified, is_active, created_at, updated_at');
      sFirst = isUUID ? sFirst.eq('id', id) : sFirst.ilike('brand_name', id.replace(/-/g, ' '));
      const { data: sellerRow } = await sFirst.maybeSingle();
      if (sellerRow) {
        return applyBoutiqueOverride(sellerToBoutique(sellerRow as SellerRow)) as Designer;
      }

      // 2. Fall back to the designers table for anything not in sellers.
      let dQuery = supabase.from('designers').select('*');
      if (isUUID) {
        dQuery = dQuery.eq('id', id);
      } else {
        dQuery = dQuery.or(`brand_name.ilike.${id},slug.ilike.${id},name.ilike.${id}`);
      }

      const { data: dData, error: dError } = await dQuery.maybeSingle();

      if (dData) {
        return applyBoutiqueOverride({
          ...dData,
          slug: dData.slug || dData.id,
          collection_name: dData.collection_name || '',
          product_images: Array.isArray(dData.product_images)
            ? (dData.product_images as unknown as string[])
            : [],
        }) as Designer;
      }

      // 2. Fallback to sellers table with public-safe columns (preserves bank details privacy)
      let sQuery = supabase.from('sellers').select('id, brand_name, city, description, profile_image, banner_image, is_verified, is_active, seller_type, instagram_handle, created_at, updated_at');
      if (isUUID) {
        sQuery = sQuery.eq('id', id);
      } else {
        sQuery = sQuery.or(`brand_name.ilike.${id}`);
      }

      const { data: sData, error: sError } = await sQuery.maybeSingle();
      if (sData) {
        return {
          id: sData.id,
          name: sData.brand_name,
          brand_name: sData.brand_name,
          city: sData.city || "India",
          category: sData.seller_type || "Independent Atelier",
          description: sData.description || "Curated independent atelier crafting authentic fashion in India.",
          price_range: "₹1,200 – ₹12,000",
          profile_image: sData.profile_image || null,
          banner_image: sData.banner_image || null,
          slug: sData.id,
          created_at: sData.created_at || new Date().toISOString(),
          updated_at: sData.updated_at || new Date().toISOString(),
          followers: 120,
          instagram_link: sData.instagram_handle ? `https://instagram.com/${sData.instagram_handle}` : null,
          collection_name: "Studio Collection",
          product_images: [],
        } as Designer;
      }

      return null;
    },
    enabled: !!id,
  });
};
