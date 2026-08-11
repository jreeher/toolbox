# The Toolbox — Phase 8: Polish

## Context

Phases 1-7 are complete and merged to `master`. Every core feature works: auth, posting, feed, comments, nailing, boards, follows, search. This is the final phase of the original 8-phase plan:

1. Foundation (done)
2. Auth & Profiles (done)
3. Homepage & Toolbox Animation (done)
4. Post Creation & Feed (done)
5. Post Detail & Comments (done)
6. Nailing & Boards (done)
7. Social & Search (done)
8. **Polish** (this spec)

The Phase 1 spec scoped Phase 8 as "loading skeletons, error boundaries, mobile nav drawer." Two other small backlog items have accumulated in `SESSION_NOTES.md` along the way and are folded into this phase since it's the natural place for cleanup work: `PostCard`'s Share button has no error handling around `navigator.clipboard.writeText`, and two security hardening items (storage RLS path-scoping, image MIME allow-list) were flagged after Phase 4's review as fast-follow, non-blocking items.

## Goals

- **Loading states**: `loading.tsx` for every route that does a real data fetch (`/feed`, `/post/[id]`, `/u/[username]`, `/u/[username]/boards`, `/boards/[id]`, `/search`) — skeleton placeholders matching each page's actual layout (masonry-grid skeletons, post-detail skeleton), shown automatically by Next.js during server-component data loading.
- **Error boundaries**: `error.tsx` at the app root (catches any unhandled render/data error) with a friendly message and a "Try again" button (Next.js's `reset()`), styled to match the design system rather than a raw stack trace.
- **Mobile nav drawer**: below the `md` breakpoint, `ToolboxNav`'s center links (Feed, Boards, search) are currently just hidden (`hidden md:flex`) with no alternative — mobile users have no way to navigate to them at all. A hamburger button opens a slide-in drawer with the same links plus auth actions.
- **Share button error handling**: wrap `navigator.clipboard.writeText` in a try/catch, show an error toast on failure instead of silently doing nothing.
- **Security hardening** (from the Phase 4 review backlog):
  1. Storage RLS: tighten `post_images_authenticated_upload` to enforce the `${user_id}/...` path prefix at the database level (`auth.uid()::text = (storage.foldername(name))[1]`), not just as an app-level convention.
  2. Image MIME validation: replace the loose `image/*` prefix check (both client `post-form.tsx` and server `actions.ts`) with an explicit allow-list (`image/jpeg`, `image/png`, `image/webp`, `image/gif`), closing the `image/svg+xml` XSS gap noted in the Phase 4 review.

## Non-goals (deferred / out of scope)

- Toast screen-reader announcements — `sonner`'s default `<Toaster>` already renders its own internal ARIA live region (verified in Phase 8 testing rather than assumed); no extra work needed here, the earlier backlog note was speculative and turns out not to be a real gap.
- Full accessibility audit (keyboard nav, focus trapping in the new mobile drawer, color contrast) — the mobile drawer gets basic keyboard dismissal (Escape closes it) and focus-visible states consistent with the rest of the app, but a comprehensive a11y pass is bigger than "polish" and not speced anywhere.
- Editing/deleting posts, comments, or boards — still out of scope; every phase since 4 has deliberately kept mutations create-only, and Phase 8 doesn't change that.
- Any new feature work — this phase is strictly hardening and finishing touches on what's already built.

## Decisions

- **Skeletons are static markup, not measured against real content** — simple pulsing placeholder blocks (`animate-pulse` + `bg-wood-dark`) roughly matching each page's shape (a grid of card-shaped rectangles for masonry pages, a large rectangle + lines for post detail). No attempt to precisely match final layout dimensions; good-enough perceived-performance signal is the goal, not pixel-perfect.
- **One root `app/error.tsx`**, not per-route error boundaries — Next.js error boundaries are nested automatically (a root one catches everything beneath it that doesn't have its own), and no individual route in this app has a distinct enough failure mode to warrant its own custom error UI yet. Simpler to reason about than eight near-identical error files.
- **Mobile drawer implementation**: a client component (`components/MobileNavDrawer.tsx`) rendered inside `ToolboxNav`, toggled by a hamburger button (lucide `Menu`/`X`) visible only below `md`. Plain CSS transition (`translate-x`) for the slide-in, not `framer-motion` — `framer-motion` is already a dependency (Phase 3's homepage animation) but pulling it into the nav for a simple slide adds a client bundle dependency to every page for a one-line CSS transition's worth of value; not justified.
- **The drawer receives the same auth/profile data `ToolboxNav` already fetched** (server component passes `user`/`profile` down as props) rather than re-fetching client-side — consistent with how the rest of the app avoids duplicate client-side auth checks when the server component already has the answer.
- **Storage RLS fix ships as `supabase/migrations/0002_security_hardening.sql`**, following the same manual-apply convention as `0001_init.sql` (documented in the README: user runs it via the Supabase SQL Editor). This migration can't be verified against the live project from this environment without direct Postgres/dashboard access the same way `0001` was originally applied — noted as a manual follow-up step for the user, same as every other migration in this project's history.
- **MIME allow-list is a shared constant** (`lib/upload-validation.ts`, exporting `ALLOWED_IMAGE_TYPES`) imported by both `post-form.tsx` (client, fast feedback) and `actions.ts` (server, authoritative check) — avoids the two lists silently drifting apart.

## Architecture

### New files
- `app/loading.tsx` — generic full-page skeleton (used as a fallback by any route without a more specific one)
- `app/feed/loading.tsx`, `app/search/loading.tsx` — masonry-grid skeleton (shared skeleton component)
- `app/post/[id]/loading.tsx` — post-detail skeleton
- `app/u/[username]/loading.tsx`, `app/u/[username]/boards/loading.tsx`, `app/boards/[id]/loading.tsx` — profile/board skeletons (header skeleton + masonry-grid skeleton)
- `components/skeletons/MasonryGridSkeleton.tsx`, `components/skeletons/PostDetailSkeleton.tsx` — shared pieces used by the loading files above
- `app/error.tsx` (client component, required by Next.js's error boundary contract) — friendly message + `reset()` button
- `components/MobileNavDrawer.tsx` — hamburger toggle + slide-in panel
- `supabase/migrations/0002_security_hardening.sql` — the two RLS/policy changes
- `lib/upload-validation.ts` — `ALLOWED_IMAGE_TYPES` constant + a small `isAllowedImageType(file)` helper

### Changed files
- `components/PostCard.tsx` — `handleShare` wrapped in try/catch, error toast on failure
- `components/ToolboxNav.tsx` — renders `<MobileNavDrawer>`, hamburger button added
- `app/post/new/post-form.tsx`, `app/post/new/actions.ts` — swap the `image/*` prefix check for `isAllowedImageType`

## Testing / verification

- `npm run build` succeeds with no type errors
- Manual: throttle/observe a data-heavy route (`/feed`) on first load → skeleton renders briefly before real content (Next.js's automatic `loading.tsx` suspense boundary)
- Manual: force a render error (temporarily throw in a server component) → root `error.tsx` renders instead of a raw Next.js error overlay; "Try again" recovers
- Manual: resize to mobile width → center nav links disappear, hamburger appears; tapping it opens the drawer with working links; Escape or tapping outside closes it
- Manual: click Share with clipboard access denied (or unavailable) → error toast shown instead of silent failure
- Manual: attempt to upload an SVG on `/post/new` → rejected client-side with a clear message; confirm server-side check also rejects it if client validation is bypassed
- The storage RLS migration is handed off as a SQL file for the user to run via the Supabase dashboard, same as `0001_init.sql` — not independently verified against the live database from this environment

## Open questions

None — resolved during brainstorming.
