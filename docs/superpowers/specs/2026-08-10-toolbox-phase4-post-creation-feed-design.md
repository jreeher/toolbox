# The Toolbox — Phase 4: Post Creation & Feed

## Context

Phases 1-3 (Foundation, Auth & Profiles, Homepage & Toolbox Animation) are complete and merged to `master`. The app has a working design system, real auth/profiles, and an animated homepage whose drawers link to `/feed?category=[slug]` and whose "HOT OFF THE WORKBENCH" strip queries real posts (currently showing an empty state since no posts exist).

This spec covers Phase 4 of the phased build-out:

1. Foundation (done)
2. Auth & Profiles (done)
3. Homepage & Toolbox Animation (done)
4. **Post Creation & Feed** (this spec)
5. Post Detail & Comments
6. Nailing & Boards
7. Social & Search
8. Polish

Phase 4 is where the app starts holding real content: users can create posts with uploaded images, and the feed displays them in a filterable, sortable, infinitely-scrolling masonry grid.

## Goals

- `/post/new`: a real, working create-post form (title, description, category, subcategory, image upload) with a live-updating preview panel, protected by Phase 2's `requireAuth()`
- Image upload to the `post-images` Supabase Storage bucket (already provisioned in Phase 1's migration)
- `/feed`: a masonry grid of post cards, filterable by category and sortable (Newest, Most Nailed, Top Rated), both driven by URL search params
- Infinite scroll: 20 posts per page, auto-loading via `IntersectionObserver` as the user scrolls
- Shared components: `<PostCard />`, `<CategoryBadge />`, `<MasonryGrid />`

## Non-goals (deferred)

- Actual NAIL IT / upvote interactivity — `PostCard` shows static counts (both start at 0 for new posts) and a comment-count link; the real click handlers and board-picker dropdown are Phase 6's job. This avoids building throwaway click handlers now.
- Post detail page content (`/post/[id]` stays a Phase 1 placeholder) — Phase 5's job. The create-post flow redirects there on success regardless, since the route already exists.
- Rich text formatting for descriptions — plain textarea for v1, per this phase's brainstorming decision.
- A masonry library — pure CSS columns (Tailwind's `columns-*` utilities) per this phase's brainstorming decision, not a JS reflow library.
- Editing or deleting posts — not in the original spec's Phase 4 scope; create-only.
- Cleanup of orphaned Storage objects if a DB insert fails after a successful upload — accepted as a rare, low-cost v1 gap (see Decisions).

## Decisions

- **PostCard is decoupled from the DB row shape**: it takes a `post`-like object and an `author`-like object as props, not a raw Supabase row. This lets the exact same component render both real feed cards and the live preview in the create-post form (which has no `id`, `created_at`, or real counts yet).
- **Filter/sort state lives in the URL** (`?category=slug&sort=newest|nailed|top`), not client component state. This keeps the first page of results server-rendered and shareable, and is consistent with how Phase 3's homepage drawers already link into `/feed?category=slug`.
- **Server Action handles both the Storage upload and the DB insert**, receiving the image as a `File` inside `FormData` (Next.js Server Actions support this natively) — no separate client-side upload call before submit. This keeps credential/auth handling entirely server-side, consistent with Phase 2's Server Action pattern for auth forms.
- **Storage path**: `post-images/{user_id}/{timestamp}-{filename}`, avoiding collisions between users and between repeat uploads by the same user.
- **Client-side pre-upload validation**: reject non-image files and files over 5MB before any network call, for fast feedback.
- **Infinite scroll's subsequent pages are fetched client-side** via the browser Supabase client (same category/sort params as the URL), appended to the initially server-rendered first page. The first page itself is server-rendered for fast initial load and shareability.
- **Orphaned Storage objects on partial failure are an accepted v1 gap** — if upload succeeds but the DB insert fails, the uploaded file isn't cleaned up. This is a rare failure mode (both operations are in the same Server Action, back to back) and not worth a compensating-transaction mechanism at this stage.

## Architecture

### Database
No schema changes. `posts` table, RLS policies, and the `post-images` Storage bucket + policies all already exist from Phase 1's migration and are sufficient: `posts_insert_own` requires `auth.uid() = user_id`, and the storage policy `post_images_authenticated_upload` allows any authenticated user to upload.

### Shared components

**`components/CategoryBadge.tsx`**: small badge rendering a category's display label (mapping the 4 slugs to their spec-given labels: `projects` → "Projects", `tips-techniques` → "Tips & Techniques", `tool-talk` → "Tool Talk", `plans-blueprints` → "Plans & Blueprints"), styled red or chrome per the design system's badge treatment, sharp/4px corners.

**`components/MasonryGrid.tsx`**: a thin layout wrapper — `columns-1 md:columns-2 lg:columns-3 gap-4` on the container, with each child needing `break-inside-avoid` (documented in the component's usage, applied by callers or via a wrapper it renders around `children`).

**`components/PostCard.tsx`**: props `{ post: { id, title, imageUrl, category, nailCount, upvoteCount, commentCount }, author: { username, avatarUrl } }`. Toolbox-red bordered card, hover scale (1.02) + deepened shadow. Shows: image, title, `<CategoryBadge />`, nail count (lucide `Hammer` icon + number, static), upvote count (lucide `ThumbsUp` icon + number, static), comment count (lucide `MessageCircle` icon + number, linking to `/post/${post.id}`), `<Avatar />` + username (linking to `/u/${author.username}`), and a Share button (copies `${origin}/post/${post.id}` to the clipboard, shows a `sonner` toast confirming).

### Create post flow

**`app/post/new/page.tsx`** (server component, already calls `requireAuth()` since Phase 2): also fetches the current user's `profiles` row (for the preview's author display), passes `{ username, avatar_url }` into a new client form component.

**`app/post/new/post-form.tsx`** (client component): controlled inputs for title, description, category (select), subcategory; an image file input with client-side validation (image MIME type, ≤5MB) that generates a local preview via `URL.createObjectURL`. Renders a two-column layout on desktop (form left, live `<PostCard />` preview right using the current form state + the passed-in author), stacked on mobile. Submits via a Server Action using `useFormState`/`useFormStatus`, consistent with Phase 2's auth forms.

**`app/post/new/actions.ts`**: `createPostAction(prevState, formData)` — re-checks auth (same pattern as Phase 2's `completeOnboardingAction`), validates required fields server-side (title, category, image — not just trusting client validation), uploads the image to `post-images/{user_id}/{timestamp}-{filename}` via the server Supabase client's Storage API, gets the public URL, inserts into `posts` (`user_id`, `title`, `description`, `category`, `subcategory`, `image_url`), and on success redirects to `/post/${newPost.id}`. Returns `{ error: string }` on failure for inline display.

### Feed page

**`app/feed/page.tsx`** (server component, replacing the Phase 1 placeholder): reads `category` and `sort` from `searchParams`, queries `posts` (public read, no auth required) with the appropriate `.eq("category", ...)` filter (if present) and `.order(...)` (newest → `created_at desc`; most nailed → `nail_count desc`; top rated → `upvote_count desc`), `.range(0, 19)` for the first 20. Renders the filter bar (category tabs + sort control, each a `<Link>` that sets the corresponding search param) and passes the first page of posts into a client component.

**`app/feed/feed-list.tsx`** (client component): renders `<MasonryGrid>` of `<PostCard />`s from the initial posts prop, plus an `IntersectionObserver`-watched sentinel `div` at the bottom. When the sentinel intersects, fetches the next 20 posts (same category/sort, next `.range()` window) via the browser Supabase client and appends them to local state. Stops observing once a fetch returns fewer than 20 rows (no more pages).

## Testing / verification

- `npm run build` succeeds with no type errors
- Manual: create a post with a real image → redirected to `/post/[id]` (still a placeholder page, confirms the row was created and redirect target is correct)
- Manual: visit `/feed` → the new post appears in the masonry grid with the correct category badge and counts at 0
- Manual: clicking category tabs and sort options changes the URL and the results
- Manual: with 20+ seeded posts, scrolling to the bottom auto-loads the next page (seeding test posts requires manually creating them through the UI, since there's no bulk-create tooling — noted as a testing limitation, not a gap in the feature itself)
- Manual: uploading a non-image file or a file over 5MB shows a client-side error before any upload attempt

## Open questions

None — resolved during brainstorming.
