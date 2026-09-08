import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Designer } from "@/types";
import { applyBoutiqueOverride } from "@/data/boutiqueOverrides";

export const useDesigners = (filters?: { search?: string; category?: string }) => {
  return useQuery({
    queryKey: ['designers', filters],
    queryFn: async () => {
      let query = supabase
        .from('designers')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply search filter
      if (filters?.search) {
        query = query.or(`brand_name.ilike.%${filters.search}%,name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
      }

      // Apply category filter
      if (filters?.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Parse product_images from JSONB to array
      return (data || []).map((designer) => applyBoutiqueOverride({
        ...designer,
        slug: designer.slug || '',
        collection_name: designer.collection_name || '',
        product_images: Array.isArray(designer.product_images) 
          ? (designer.product_images as unknown as string[])
          : []
      })) as Designer[];
    },
  });
};

export const useDesigner = (id: string) => {
  return useQuery({
    queryKey: ['designer', id],
    queryFn: async () => {
      if (!id) return null;

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      // 1. Try designers table first
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
