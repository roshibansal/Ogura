-- Create storage bucket for try-on images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tryon-images',
  'tryon-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view images
DROP POLICY IF EXISTS "Public can view try-on images" ON storage.objects;
CREATE POLICY "Public can view try-on images" ON storage.objects FOR SELECT
USING (bucket_id = 'tryon-images');

-- Allow authenticated users to upload images
DROP POLICY IF EXISTS "Authenticated users can upload try-on images" ON storage.objects;
CREATE POLICY "Authenticated users can upload try-on images" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tryon-images' AND auth.role() = 'authenticated');

-- Allow users to delete their own uploads
DROP POLICY IF EXISTS "Users can delete their own try-on images" ON storage.objects;
CREATE POLICY "Users can delete their own try-on images" ON storage.objects FOR DELETE
USING (bucket_id = 'tryon-images' AND auth.role() = 'authenticated');