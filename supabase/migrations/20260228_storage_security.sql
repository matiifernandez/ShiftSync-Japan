-- Storage Security: Make receipt/ticket buckets private and add RLS policies
-- Run this migration in the Supabase Dashboard SQL editor.
--
-- BEFORE running this migration:
-- 1. Go to Storage > Buckets in Supabase Dashboard
-- 2. For the 'receipts' bucket: click the bucket → Settings → toggle OFF "Public bucket"
-- 3. For the 'avatars' bucket: decide if it should be public or private.
--    NOTE: Public buckets in Supabase do NOT enforce RLS for writes. If you want the
--    "Users can upload their own avatar" policy below to be effective, ensure the
--    'avatars' bucket is NOT marked as a public bucket.
-- 4. Then run this SQL to add the access policies.
--
-- This migration is idempotent: it drops policies before (re)creating them.

-- ============================================================
-- Receipts bucket: org-scoped read, user-scoped write
-- ============================================================

DROP POLICY IF EXISTS "Users can upload their own receipts" ON storage.objects;
CREATE POLICY "Users can upload their own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view receipts from their organization" ON storage.objects;
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

-- ============================================================
-- Avatars bucket: public read is acceptable for profile pictures.
-- Restrict uploads to the owner only.
-- ============================================================

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE auth.uid()::text || '_%'
);

DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================================
-- Tickets bucket: not currently used by the application.
-- app/travel/add-ticket.tsx stores ticket images in the 'receipts' bucket.
-- When a dedicated 'tickets' bucket is introduced in app code, add org-scoped
-- RLS policies here similar to the receipts bucket policies above.
-- ============================================================
