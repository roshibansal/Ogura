DROP POLICY IF EXISTS "Anyone can upload application images" ON storage.objects;
CREATE POLICY "Anyone can upload application images" ON storage.objects FOR INSERT TO anon
WITH CHECK (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = 'applications'
);