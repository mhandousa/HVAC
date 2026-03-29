-- Create commissioning-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'commissioning-photos', 
  'commissioning-photos', 
  true,
  5242880,  -- 5MB limit per image
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

-- RLS policies for the bucket
CREATE POLICY "Authenticated users can upload commissioning photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'commissioning-photos');

CREATE POLICY "Anyone can view commissioning photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'commissioning-photos');

CREATE POLICY "Authenticated users can delete commissioning photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'commissioning-photos');