# The Toolbox — Phase 5: Post Detail & Comments

## Context

Phases 1-4 (Foundation, Auth & Profiles, Homepage & Toolbox Animation, Post Creation & Feed) are complete and merged to `master`. Users can sign up, create posts with images, and browse them in a filterable, infinite-scrolling feed. `/post/[id]` is still a Phase 1 placeholder (`"Post {id} — coming in Phase 5"`), and every `PostCard`'s comment-count icon already links there.

This spec covers Phase 5 of the phased build-out:

1. Foundation (done)
2. Auth & Profiles (done)
3. Homepage & Toolbox Animation (done)
4. Post Creation & Feed (done)
5. **Post Detail & Comments** (this spec)
6. Nailing & Boards
7. Social & Search
8. Polish

Phase 5 replaces the placeholder with a real post detail page: the full post, its author, and a threaded comment section (one level of replies, matching the `comments.parent_id` self-reference already in the Phase 1 schema).

## Goals

- `/post/[id]`: real detail page — large image, title, description, category badge, author (avatar + username, linking to `/u/[username]`), static nail/upvote/comment counts (same as `PostCard`, real interactivity is Phase 6)
- Comment thread: top-level comments plus one level of replies, newest-first for top-level
- Comment composer for logged-in users; logged-out users see a "sign in to comment" prompt instead
- Reply composer, inline under the comment being replied to, one level deep only (no reply-to-reply nesting in the UI, even though the schema allows arbitrary depth via `parent_id`)
- A handful of "Related posts" (same category, excluding the current post) below the comment thread

## Non-goals (deferred)

- Nail/upvote click handlers — still static display, per Phase 4's spec; real interactivity is Phase 6's job.
- Editing or deleting comments — create-only, consistent with Phase 4's create-only stance on posts.
- Deleting posts, or any post-owner moderation of comments.
- Comment pagination — v1 loads the full thread in one query; revisit if a post ever gets large enough for this to matter (not expected pre-launch).
- Real-time updates (new comments from other users appearing without a refresh) — out of scope, no Supabase Realtime subscription in this phase.
- Nested replies beyond one level in the UI — the schema supports it, the UI doesn't expose it yet.

## Decisions

- **Comment thread is server-rendered on initial load**, same pattern as the feed's first page: `app/post/[id]/page.tsx` queries post + author + comments + comment authors + related posts server-side, passes them into a client component for the interactive composer/reply bits.
- **One SQL query per concern, joined client-side by id**, not a single deep Supabase join — matches the existing pattern in `app/feed/page.tsx` (separate `posts` and `profiles` lookups). Keeps queries simple and RLS-predictable.
- **Comments and replies share one Server Action** (`app/post/[id]/actions.ts` → `createCommentAction`), distinguished by an optional `parentId` field in the `FormData`. Avoids two near-identical actions.
- **Client-side comment tree building**: the page fetches all comments for the post in one query (flat list, ordered `created_at asc`), then groups replies under their `parent_id` in the client component. Simpler than a recursive SQL CTE for a two-level-deep UI.
- **Related posts**: `posts` where `category = current.category and id != current.id`, ordered `created_at desc`, limited to 4, reusing `PostCard` and `MasonryGrid` from Phase 4 — no new card component needed.
- **Auth gating for comments** follows Phase 2's pattern: the page itself doesn't require auth (post detail is public), but the comment form checks `auth.getUser()` inside the Server Action and returns an error if unauthenticated; the client shows a sign-in prompt instead of the form when there's no session, mirroring how `ToolboxNav` already branches on auth state.

## Architecture

### Database
No schema changes. `comments` table (with `parent_id` self-reference) already exists from Phase 1, with RLS policies already in place and sufficient: `comments_select_all` (public read), `comments_insert_own` (`auth.uid() = user_id`), plus owner-only update/delete (unused by this phase, since editing/deleting comments is a non-goal).

### Components

**`components/CommentThread.tsx`** (client component): props `{ postId, comments: CommentWithAuthor[], currentUser: { id, username, avatarUrl } | null }`. Groups the flat `comments` array into top-level + replies-by-parent-id. Renders each top-level comment via `CommentItem`, with its replies indented beneath. Renders the top-level composer at the top (or sign-in prompt if `currentUser` is null).

**`components/CommentItem.tsx`**: single comment — avatar, username, timestamp (relative, e.g. "2h ago"), content, and a "Reply" toggle that reveals an inline reply composer (only for top-level comments, since replies are one level deep).

**`components/CommentComposer.tsx`**: shared textarea + submit button, used for both top-level and reply composition, driven by `useFormState`/`useFormStatus` against `createCommentAction`, consistent with Phase 4's form pattern.

### Post detail flow

**`app/post/[id]/page.tsx`** (server component, replacing the Phase 1 placeholder): fetches the post by id (404 via `notFound()` if missing), the author's profile, the current user's session (for comment-gating, not required for the page itself), all comments for the post joined with commenter profiles, and up to 4 related posts. Renders the post header (image, title, description, badge, author, static counts — reusing pieces of `PostCard`'s presentation, not the whole card), `<CommentThread>`, and a "Related posts" `<MasonryGrid>`.

**`app/post/[id]/actions.ts`**: `createCommentAction(prevState, formData)` — checks auth, validates `content` (non-empty, reasonable max length) and `postId`, inserts into `comments` with optional `parent_id` from `formData`, revalidates the post detail path. Returns `{ error: string }` on failure.

## Testing / verification

- `npm run build` succeeds with no type errors
- Manual: visit `/post/[id]` for a real post → correct title, image, description, category badge, author link, counts
- Manual: visit `/post/[id]` for a nonexistent id → 404
- Manual: logged out → comment form replaced by sign-in prompt; logged in → can post a top-level comment, appears in thread without full page reload feel (revalidation)
- Manual: reply to a top-level comment → appears nested beneath it
- Manual: related posts section shows same-category posts, excludes the current post, empty state if none exist

## Open questions

None — resolved during brainstorming. (Confirmed `comments` RLS policies already exist in the Phase 1 migration; no schema follow-up needed.)
