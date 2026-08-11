# Session Notes — Autonomous Work Log

Started while the user stepped away. This file tracks decisions made autonomously (taking the recommended option at each choice point) and any open questions worth their attention when they're back. Not part of the app — safe to delete once reviewed.

## Status: Phase 5 complete, merged to master

Phase 5 (Post Detail & Comments) is complete, manually verified end-to-end against a real Supabase project (signup → onboarding → post creation → commenting → replying → logged-out view → 404), merged to `master`, and pushed to GitHub. This session picked up on a second computer, working from the design specs/plans/session notes already in the repo rather than any memory of the original session.

Two bugs found and fixed during this phase (both pre-existing or newly introduced, not tooling artifacts):

1. **Pre-existing Phase 4 bug**: the feed's `posts` ↔ `profiles` query (`app/feed/page.tsx`, `app/feed/feed-list.tsx`) was ambiguous to PostgREST because of the `upvotes` bridge table (which also FKs to both `posts` and `profiles`), throwing `PGRST201` and silently returning zero posts. Fixed with an explicit FK hint: `profiles!posts_user_id_fkey(...)`. This means the feed was likely broken on this Supabase project the whole time Phase 4 was "working" elsewhere — worth checking whether the other computer's project has the same `upvotes` FK shape, or whether this only surfaces on fresh migrations.
2. **New Phase 5 bug**: `CommentComposer`'s "did a submission just complete" detection used an `isFirstRender` ref flag, which isn't safe under React 18 Strict Mode's dev-mode double-effect-invocation — the reply composer would flash open and immediately snap shut. Fixed with the standard pattern of comparing against the previous state value via a ref, not a boolean flag.

## Open questions for the user

None blocking — see the backlog notes below for two security hardening items worth a look, but nothing that needed a decision mid-flight.

## Decisions made autonomously (informational, not blocking)

- Continuing Phase 4 (Post Creation & Feed) implementation via subagent-driven-development, same workflow as Phases 1-3.
- Will default to the "recommended" option at any future brainstorming/execution choice point instead of stopping to ask, per the user's request to keep working through the night.
- Will still merge to `master` + push to GitHub after each phase completes review, matching the pattern approved for Phases 1-3, since the user explicitly approved this exact flow twice already this session.
- Will still create a feature branch per phase and get it independently reviewed (spec + code quality + final holistic pass) before merging — no shortcuts on review rigor, just no pausing for approval between phases.

## Backlog notes for Phase 8 (Polish)

- PostCard's Share button has no error handling around `navigator.clipboard.writeText` (silent failure if clipboard access is denied). Low priority.
- Toast notifications (sonner) aren't screen-reader-announced by default; worth an ARIA live region pass if accessibility becomes a priority.

## Backlog notes for a security hardening follow-up (from Phase 4 final review)

1. **Storage RLS policy isn't path-scoped.** The `post_images_authenticated_upload` policy (Phase 1 migration) only checks `bucket_id = 'post-images' and auth.role() = 'authenticated'` — any authenticated user can currently overwrite any other user's uploaded file, since the `${user_id}/...` path prefix is an app-level convention, not DB-enforced. Fix: a new migration tightening the policy to `with check (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1])`. Cheap now; gets more annoying to retrofit once boards/avatars reuse this bucket.
2. **Image MIME validation is a loose `image/*` prefix check**, both client- and server-side in the create-post flow. This would accept `image/svg+xml`, which can carry script content and is publicly served once uploaded. Fix: switch to an explicit allow-list (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) in both `app/post/new/actions.ts` (server) and `app/post/new/post-form.tsx` (client).

Neither blocked the Phase 4 merge — the final holistic review rated the branch "Approved (merge-ready)" and recommended these as fast-follow items, not blockers.
