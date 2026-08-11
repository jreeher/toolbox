-- 0002_security_hardening.sql — path-scope the post-images upload policy
--
-- The original policy (0001_init.sql) only checked bucket_id and that the
-- caller was authenticated, so any authenticated user could upload to (and
-- overwrite) any other user's file — the `${user_id}/...` path prefix was
-- an app-level convention only, not DB-enforced. This ties the policy to
-- the actual storage path, matching the `${user_id}/{uuid}.{ext}` layout
-- the app has used since Phase 4.

drop policy if exists "post_images_authenticated_upload" on storage.objects;

create policy "post_images_authenticated_upload"
on storage.objects for insert
with check (
  bucket_id = 'post-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
