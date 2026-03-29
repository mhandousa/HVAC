-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload documents to their org folder
CREATE POLICY "Users can upload documents to their org"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Allow users to view documents in their org
CREATE POLICY "Users can view documents in their org"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Allow admins to delete documents in their org
CREATE POLICY "Admins can delete documents in their org"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add UPDATE policy for documents table
CREATE POLICY "Engineers+ can update documents"
ON public.documents FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'engineer')
  )
);