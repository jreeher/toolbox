# The Toolbox — Phase 7: Social & Search

## Context

Phases 1-6 are complete and merged to `master`. Posts, comments, nailing, and boards all work. `/u/[username]` is still a Phase 1 placeholder, `/search` is still a Phase 1 placeholder, and `ToolboxNav`'s center links ("Feed", "Categories", "Boards") are still static, non-interactive `<span>`s — the Phase 2 plan explicitly deferred wiring them to Phase 4 (Feed) and Phase 6 (Boards), and both of those phases are now done but the nav was never updated. This spec covers Phase 7 of the phased build-out:

1. Foundation (done)
2. Auth & Profiles (done)
3. Homepage & Toolbox Animation (done)
4. Post Creation & Feed (done)
5. Post Detail & Comments (done)
6. Nailing & Boards (done)
7. **Social & Search** (this spec)
8. Polish

Phase 7 builds real user profile pages with follow/unfollow, a working search page, and closes the small nav-wiring gap left over from Phases 4/6 (in scope here since search needs a real entry point in the nav anyway).

## Goals

- **`/u/[username]`**: real profile page — avatar, username, bio, follower/following counts, a Follow/Unfollow button (hidden on your own profile), and a masonry grid of that user's posts. Links to `/u/[username]/boards` (built in Phase 6).
- **Follow/unfollow**: toggle button, optimistic UI, same interaction pattern as nailing/upvoting (Phase 6).
- **`/search`**: a query input and results grid using the `posts.search_vector` GIN index (in place since Phase 1) via Postgres full-text search, reusing `PostCard`/`MasonryGrid`.
- **Nav wiring**: `ToolboxNav`'s "Feed" and "Boards" become real links (`/feed`, `/u/[username]/boards` when logged in else nothing special — see Decisions), and a search input is added, submitting to `/search?q=...`.

## Non-goals (deferred)

- **"Categories" nav link removed, not wired** — seeing the Phase 4 feed already exposes category filtering via tabs on `/feed` itself, a top-level "Categories" nav item has no obvious single destination (which category?). Per the original Phase 1 placeholder route list there's no dedicated `/categories` page, and inventing one is out of scope. Replaced with a link to `/feed` (same destination as "Feed") is redundant, so "Categories" is dropped from the nav rather than wired to a fake destination — this is a small deviation from the letter of the Phase 2 plan's "becomes real in Phase 4" note, justified because no such page was ever speced.
- Follower/following **list** pages (who follows me / who I follow) — only counts are shown this phase. Viewing the actual lists is a reasonable Phase 8 polish item or later.
- Activity feed / notifications for new followers — out of scope.
- Editing your own profile (bio, avatar) after onboarding — never speced in any phase; noted as a gap but not this phase's job.
- Search filters (category, date range) or pagination beyond a reasonable single-page result limit — v1 is a single query, top N results by relevance.
- Autocomplete / live search-as-you-type — the nav search input is a plain form submit to `/search`, consistent with the project's preference for server-rendered simplicity over client-side fetch complexity elsewhere.

## Decisions

- **Follow uses the same optimistic-toggle pattern as Nail/Upvote** (Phase 6): a new `toggleFollowAction(targetUserId, path)` in `lib/actions/engagement.ts`, `follows` table already has the right RLS (`follows_insert_own` checks `auth.uid() = follower_id`, delete same).
- **Follower/following counts are computed with `count: "exact", head: true` queries** (`supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileId)`), not a denormalized column — `follows` has no trigger-maintained count column (unlike `nail_count`/`upvote_count` on `posts`), and profile pages are viewed far less often than posts in a feed, so an extra count query per profile view is an acceptable cost without adding a new migration.
- **Search uses Postgres `websearch_to_tsquery` via Supabase's `.textSearch()`** (`.textSearch("search_vector", query, { type: "websearch" })`), which tolerates natural free-text input (quotes, `-exclude`, `or`) better than the default `plainto_tsquery`. No relevance ranking beyond Postgres's default tsvector ordering — `.order()` isn't applied on top of textSearch, keeping this simple for v1.
- **Search results limited to 40**, single page, no infinite scroll — search result sets are expected to be small for this app's likely scale; revisit if that assumption breaks.
- **Nav search is a plain GET `<form>`** (`action="/search"`, input `name="q"`), no client-side JS needed — submitting it is just a normal navigation to `/search?q=...`, consistent with how Phase 4's feed filters already use plain links/URL state rather than client fetch.
- **"Categories" dropped from nav, "Boards" links to `/u/[username]/boards` when logged in** (hidden entirely when logged out, since there's no meaningful destination without a signed-in user's own boards) — **"Feed" links to `/feed`** always.
- **Profile page's post grid reuses the exact same viewer-engagement wiring from Phase 6** (`getViewerEngagement`, `getViewerBoards`) so nail/upvote buttons work correctly on a user's own post grid too, not just the feed.

## Architecture

### Database
No schema changes. `follows` table + RLS from Phase 1 is sufficient. `posts.search_vector` (generated tsvector column) + GIN index from Phase 1 is sufficient for search.

### Shared logic

**`lib/actions/engagement.ts`** (existing file, adds one export): `toggleFollowAction(targetUserId, path)` — auth check, look up existing `follows` row (`eq("follower_id", user.id).eq("following_id", targetUserId)`), insert or delete, revalidate `path`. Guards against following yourself (`targetUserId === user.id` → error) even though the UI never renders the button on your own profile, as defense in depth.

### Components

**`components/FollowButton.tsx`** (client): mirrors `UpvoteButton`'s shape — optimistic toggle, redirects logged-out clicks to `/login?reason=auth`, calls `toggleFollowAction`.

### Pages

**`app/u/[username]/page.tsx`** (server component, replacing the Phase 1 placeholder): looks up the profile by username (`notFound()` if missing), fetches follower/following counts, whether the viewer follows this profile (skipped if logged out or viewing your own profile), the profile's posts (`posts.eq("user_id", profile.id).order("created_at desc")`), and viewer engagement/boards for those posts (Phase 6 helpers). Renders profile header (avatar, username, bio, counts, `<FollowButton>` or nothing if it's your own profile) + `<MasonryGrid>` of `<PostCard>`s + a link to `/u/[username]/boards`.

**`app/search/page.tsx`** (server component, replacing the Phase 1 placeholder): reads `q` from `searchParams`; if empty, renders just the search form with a prompt ("Search for posts..."); if present, runs the `textSearch` query joined to `profiles` (same `profiles!posts_user_id_fkey` embed pattern as feed/post-detail, since search also queries `posts`), computes viewer engagement/boards for the result set, and renders results via `<MasonryGrid>`/`<PostCard>` (empty state if no matches).

### Nav changes

**`components/ToolboxNav.tsx`**: "Feed" becomes `<Link href="/feed">`, "Categories" removed, "Boards" becomes `<Link href="/u/${profile.username}/boards">` shown only when `user && profile`. A `<form action="/search">` with a text input (`name="q"`, placeholder "Search...") and a submit icon button (lucide `Search`) is added to the nav, visible at all times (search doesn't require auth).

## Testing / verification

- `npm run build` succeeds with no type errors
- Manual: visit `/u/[username]` for a real user → correct avatar/bio/counts/post grid; for a nonexistent username → 404
- Manual: logged in as a different user, click Follow → count increments, persists on reload, button flips to "Unfollow"; click again → decrements
- Manual: logged out, click Follow → redirected to sign in
- Manual: visit your own `/u/[username]` → no Follow button shown
- Manual: nav search a real word from an existing post's title → that post appears in `/search` results; search a nonsense string → empty state, no error
- Manual: nav "Feed"/"Boards" links navigate correctly; "Boards" hidden when logged out

## Open questions

None — resolved during brainstorming.
