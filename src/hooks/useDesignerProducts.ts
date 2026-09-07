import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DesignerProduct, ProductFilters } from "@/types";

const PRODUCTS_PER_PAGE = 12;

export const useDesignerProducts = (
  designerId: string | undefined,
  filters: ProductFilters = {},
  page: number = 1
) => {
  return useQuery({
    queryKey: ['designer-products', designerId, filters, page],
    queryFn: async () => {
      if (!designerId) return { products: [], totalCount: 0 };

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(designerId);
      if (isUUID) {
        query = query.or(`designer_id.eq.${designerId},seller_id.eq.${designerId}`);
      } else {
        query = query.ilike('brand', designerId);
      }

      query = query.order('created_at', { ascending: false });

      // Apply category filter
      if (filters.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
      }

      // Apply price range filter
      if (filters.priceRange) {
        query = query
          .gte('price', filters.priceRange[0])
          .lte('price', filters.priceRange[1]);
      }

      // Apply availability filter
      if (filters.inStockOnly) {
        query = query.eq('is_available', true);
      }

      // Apply pagination
      const from = (page - 1) * PRODUCTS_PER_PAGE;
      const to = from + PRODUCTS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Parse JSONB fields with proper typing
      const products: DesignerProduct[] = (data || []).map((product) => ({
        id: product.id,
        title: product.title,
        price: product.price,
        original_price: product.original_price ?? undefined,
        images: Array.isArray(product.images) ? (product.images as string[]) : [],
        category: product.category,
        colors: Array.isArray(product.colors) 
          ? (product.colors as { name: string; hex: string }[]) 
          : [],
        sizes: Array.isArray(product.sizes) ? (product.sizes as string[]) : [],
        description: product.description ?? undefined,
        material: product.material ?? undefined,
        is_available: product.is_available ?? true,
        designer_id: product.designer_id,
        created_at: product.created_at ?? undefined,
      }));

      // Apply color filter client-side (since colors are stored as JSONB)
      let filteredProducts = products;
      if (filters.colors && filters.colors.length > 0) {
        filteredProducts = products.filter((product) =>
          product.colors.some((c) => filters.colors!.includes(c.name))
        );
      }

      return {
        products: filteredProducts,
        totalCount: count || 0,
        hasMore: (count || 0) > page * PRODUCTS_PER_PAGE,
      };
    },
    enabled: !!designerId,
  });
};

export const useDesignerCategories = (designerId: string | undefined) => {
  return useQuery({
    queryKey: ['designer-categories', designerId],
    queryFn: async () => {
      if (!designerId) return [];

      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('designer_id', designerId);

      if (error) throw error;

      // Get unique categories
      const categories = [...new Set(data?.map((p) => p.category) || [])];
      return ['All', ...categories];
    },
    enabled: !!designerId,
  });
};
