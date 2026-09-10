
-- Allow anonymous uploads to tryon-images bucket
DROP POLICY IF EXISTS "Anyone can upload tryon images" ON storage.objects;
CREATE POLICY "Anyone can upload tryon images" ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'tryon-images');

-- Allow anonymous reads from tryon-images bucket
DROP POLICY IF EXISTS "Anyone can read tryon images" ON storage.objects;
CREATE POLICY "Anyone can read tryon images" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'tryon-images');
