-- Storage Security: Make receipt/ticket buckets private and add RLS policies
-- Run this migration in the Supabase Dashboard SQL editor.
--
-- BEFORE running this migration:
-- 1. Go to Storage > Buckets in Supabase Dashboard
-- 2. For each bucket (receipts, tickets): click the bucket → Settings → toggle OFF "Public bucket"
-- 3. Then run this SQL to add the access policies.

-- Receipts bucket: users can only access receipts from their own organization
CREATE POLICY "Users can upload their own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view receipts from their organization"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND
  EXISTS (
    SELECT 1 FROM public.profiles uploader
    JOIN public.profiles viewer ON viewer.organization_id = uploader.organization_id
    WHERE uploader.id::text = (storage.foldername(name))[1]
      AND viewer.id = auth.uid()
  )
);

-- Tickets bucket: same org-scoped access
CREATE POLICY "Users can upload their own tickets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tickets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view tickets from their organization"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tickets' AND
  EXISTS (
    SELECT 1 FROM public.profiles uploader
    JOIN public.profiles viewer ON viewer.organization_id = uploader.organization_id
    WHERE uploader.id::text = (storage.foldername(name))[1]
      AND viewer.id = auth.uid()
  )
);

-- Avatars bucket: public read is acceptable for profile pictures.
-- Restrict uploads to the owner only.
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE auth.uid()::text || '_%'
);

CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
