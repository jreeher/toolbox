# The Toolbox — Phase 6: Nailing & Boards

## Context

Phases 1-5 are complete and merged to `master`. Posts can be created, browsed in the feed, and viewed on a detail page with comments. Every `PostCard` and the post detail page currently show **static** nail/upvote counts with no click handlers — Phase 4's spec explicitly deferred that interactivity to this phase: *"the real click handlers and board-picker dropdown are Phase 6's job."*

This spec covers Phase 6 of the phased build-out:

1. Foundation (done)
2. Auth & Profiles (done)
3. Homepage & Toolbox Animation (done)
4. Post Creation & Feed (done)
5. Post Detail & Comments (done)
6. **Nailing & Boards** (this spec)
7. Social & Search
8. Polish

Phase 6 makes the "Nail It" and upvote buttons actually work, adds a board-picker so nailing a post can file it into a collection, and builds out board CRUD (create, view, list a user's boards) on top of the `boards`/`nails` tables and RLS policies that have existed since Phase 1's migration — no schema changes needed this phase.

## Goals

- **Upvote toggle**: click to upvote/un-upvote a post, working on both `PostCard` (feed, related posts) and the post detail page, optimistic UI, real `upvote_count` via the existing DB trigger.
- **Nail toggle with board picker**: clicking "Nail It" on a logged-out-inaccessible post opens a small dropdown/popover to pick which board to save it to (or "Just Nail It" with no board — `nails.board_id` is nullable). Un-nailing removes the specific `nails` row.
- **Board CRUD**:
  - Create a board (name, description, public/private) from the board picker ("+ New Board") or a dedicated form.
  - `/boards/[id]`: real board detail page — board name/description/owner, masonry grid of nailed posts in that board, respecting `is_public`/ownership for private boards.
  - `/u/[username]/boards`: grid of a user's public boards (their own private boards too, if viewing your own).
- **Auth gating**: both nail and upvote buttons redirect logged-out users to sign in (consistent with Phase 5's comment gating), rather than silently failing.

## Non-goals (deferred)

- Editing/deleting/reordering boards or their contents beyond removing a nail — out of scope, matches the create-only stance taken in Phases 4-5.
- Moving a nailed post between boards after the fact — un-nail and re-nail into a different board is the v1 workaround.
- Board cover images (auto-generated from the first/most-recent nailed post, or custom upload) — v1 boards render as a title + grid only, no dedicated cover art.
- Real-time count updates from other users' actions — same accepted gap as Phase 5.
- Follow/social features, search — Phase 7.

## Decisions

- **Optimistic UI for both toggles**: nail/upvote buttons flip immediately on click (updating local component state) and reconcile if the server action fails (revert + toast error), matching the responsiveness users expect from a "like" button, rather than waiting on a round-trip before showing feedback.
- **Server Actions, not a REST/client-fetch API route**: consistent with every prior phase's mutation pattern (Phase 2 auth, Phase 4 post creation, Phase 5 comments) — `toggleNailAction` / `toggleUpvoteAction` in a new `app/post/[id]/actions.ts`-adjacent home: since `PostCard` is used from the feed, homepage strip, *and* post detail page, these actions live in a shared `lib/actions/engagement.ts` rather than a route-specific `actions.ts`, since they're called from multiple routes' components.
- **Nail state must be known per-post per-viewer to render the toggle correctly.** The feed/detail page server components fetch the current user's `nails` rows for the visible post ids (`nails.select("post_id, board_id").eq("user_id", currentUserId).in("post_id", visiblePostIds)`) alongside the posts query, and pass an `isNailed`/`nailedBoardId` flag into `PostCard`. Same pattern for upvotes (`upvotes.select("post_id").eq("user_id", ...).in(...)`). For logged-out viewers, this lookup is skipped and every card shows the un-nailed/un-upvoted state.
- **Board picker is a lightweight popover, not a full modal**: a small dropdown anchored to the Nail button listing the user's boards (name only) plus "Just Nail It" (no board) and "+ New Board" (expands an inline mini-form: name + public/private toggle, no description field in the quick-create — description is only on the dedicated board page/creation flow if we add one, keeping the popover fast). This avoids a heavyweight modal for what should be a quick action, matching Pinterest's own UX for this exact interaction.
- **`PostCard` grows nail/upvote props** (`isNailed`, `nailedBoardId`, `isUpvoted`, plus the user's boards list for the picker) rather than fetching its own state client-side, keeping it a presentational component fed by its server-component callers — consistent with Phase 4's original "PostCard is decoupled from the DB row shape" decision.
- **`/boards/[id]` and `/u/[username]/boards` are server components**, following the same read pattern as `/feed` and `/post/[id]`: query board(s) + owner profile + nailed posts (join through `nails` → `posts` → `profiles`), respecting RLS (private boards return nothing for non-owners automatically via `boards_select_public_or_own`).
- **Un-nailing from a board page removes the nail entirely** (not just from that board — there's no "board membership" separate from the nail itself, since `nails.board_id` IS the board membership). This matches the schema: a nail already has at most one board via the nullable FK, so "un-nail" and "remove from board" are the same operation.

## Architecture

### Database
No schema changes. `nails` (with nullable `board_id`), `boards`, `upvotes` tables, RLS, and the `nail_count`/`upvote_count` triggers all already exist from Phase 1.

### Shared logic

**`lib/actions/engagement.ts`** (new): `toggleNailAction(postId, boardId | null)` and `toggleUpvoteAction(postId)` — both re-check `auth.getUser()` (return an error/redirect signal if logged out), then check for an existing row (`nails`/`upvotes` `.select().eq("user_id", ...).eq("post_id", ...).maybeSingle()`) to decide insert vs. delete. Revalidate the calling path (passed in, since these are called from `/feed`, `/`, and `/post/[id]`).

### Components

**`components/NailButton.tsx`** (client): hammer icon + count, click opens `<BoardPickerPopover>` if not currently nailed (or immediately un-nails via `toggleNailAction(postId, null)` if already nailed — no picker needed to remove). Optimistic count/state update, reverts on action error with a toast.

**`components/BoardPickerPopover.tsx`** (client): small anchored popover — lists `boards: {id, name}[]` passed as a prop (the viewer's own boards, fetched server-side by the caller), a "Just Nail It" option, and an inline "+ New Board" mini-form that calls a new `createBoardAction` (name + `is_public` checkbox only) and immediately uses the new board as the nail target on success.

**`components/UpvoteButton.tsx`** (client): thumbs-up icon + count, click calls `toggleUpvoteAction`, optimistic toggle, no picker needed.

**`PostCard.tsx` changes**: replaces the static nail/upvote `<span>`s with `<NailButton>`/`<UpvoteButton>`, gaining new required-ish props (`isNailed`, `nailedBoardId`, `isUpvoted`, `viewerBoards`) that default to "logged-out" safe values (not nailed, empty boards list) when the caller has no signed-in viewer, so the create-post live preview (Phase 4) keeps working unchanged by passing nothing.

### Board pages

**`app/boards/[id]/page.tsx`** (server component, replacing the Phase 1 placeholder): fetches the board row (RLS handles the public/private gate — a private board owned by someone else returns no row, rendered as `notFound()`), the owner's profile, and nailed posts in the board (`nails.eq("board_id", id).select("post_id, posts(*, profiles!posts_user_id_fkey(username, avatar_url))")`, ordered by nail `created_at desc`). Renders board name/description/owner header + `<MasonryGrid>` of `<PostCard>`s (empty state if no posts nailed yet).

**`app/u/[username]/boards/page.tsx`** (server component, replacing the Phase 1 placeholder): looks up the profile by username, queries their boards (public ones always; private ones too if the viewer is the profile owner), renders a grid of board cards (name, post count, first-nailed-post thumbnail if any) linking to `/boards/[id]`.

**`lib/actions/boards.ts`** (new): `createBoardAction(name, isPublic)` — auth check, insert into `boards`, returns the new board's id/name for the picker to use immediately.

## Testing / verification

- `npm run build` succeeds with no type errors
- Manual: logged out, click Nail/Upvote on a `PostCard` → redirected to sign in (or shown a sign-in prompt, matching Phase 5's comment gating), not a silent no-op
- Manual: logged in, click Upvote → count increments immediately, persists on reload; click again → decrements
- Manual: click Nail It with no existing boards → picker shows only "Just Nail It" / "+ New Board"; create a board inline → post is nailed into it, board appears in `/u/[username]/boards`
- Manual: nail the same post into a board, then un-nail from the post card → nail_count decrements, post no longer appears on `/boards/[id]`
- Manual: visit another user's private board directly by URL → 404
- Manual: visit `/boards/[id]` for a board with 0/1/many nailed posts → correct empty state and grid rendering

## Open questions

None — resolved during brainstorming.
