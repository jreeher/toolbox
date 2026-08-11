# The Toolbox — Phase 3: Homepage & Toolbox Animation

## Context

Phase 1 (Foundation) and Phase 2 (Auth & Profiles) are complete and merged to `master`: Next.js 14 scaffold, design system, Supabase SSR wiring, the full database migration, session-aware navigation, and working signup/login/onboarding/sign-out.

This spec covers Phase 3 of the phased build-out:

1. Foundation (done)
2. Auth & Profiles (done)
3. **Homepage & Toolbox Animation** (this spec)
4. Post Creation & Feed
5. Post Detail & Comments
6. Nailing & Boards
7. Social & Search
8. Polish

Phase 3 replaces the Phase 1 homepage placeholder (`app/page.tsx`) with the real animated toolbox hero and a "recently nailed" posts strip.

## Goals

- An animated hero on `/`: title + tagline, a closed-toolbox photo that "opens" (tilts away), revealing a CSS-built open toolbox with four drawers that slide out in sequence, each a real link to `/feed?category=[slug]`
- Hover state on drawers (slides out further, deepens shadow)
- A "HOT OFF THE WORKBENCH" horizontal strip showing the 6 most-recently-created posts, backed by a real Supabase query (will show an empty state until Phase 4 adds post creation)
- `prefers-reduced-motion` support: the hero renders directly in its final state, no animated transitions, for users who've requested reduced motion

## Non-goals (deferred)

- The full `<PostCard />` component (nail/upvote actions, category badge, author avatar) — that's Phase 4's job. The recent-posts strip in this phase uses a minimal thumbnail-only card (image + title), not the final card design.
- Actual filtering behavior on `/feed?category=[slug]` — `/feed` remains a Phase 1 placeholder until Phase 4; the drawers link there with the right query param now so no rework is needed later, but clicking through won't yet show filtered results.
- Any change to `/feed`, `/post/*`, or other placeholder pages beyond what's needed for the drawer links to resolve (they already resolve, per Phase 1).

## Decisions

- **Photo + CSS hybrid, not pure photo or pure illustration:** the Unsplash closed-toolbox photo sets the mood on load, then tilts away (`rotateX` + `perspective`, fading out) to reveal a CSS/Tailwind-built open toolbox body underneath with real, independently-animating drawers. A flat photo can't itself split into hinged, individually-animating parts, so the photo's job ends once the "lid opens" — the interactive part is entirely CSS/Framer Motion from there.
- **State machine, not fixed timers:** the hero's animation stages (`closed` → `opening` → `open`) advance via Framer Motion's `onAnimationComplete` callbacks rather than hardcoded `setTimeout` durations, so each stage genuinely waits for the previous one to finish.
- **Recent posts strip uses real data now:** the `posts` table already exists (Phase 1 migration), so Phase 3 queries it for real (`order by created_at desc limit 6`) rather than deferring to Phase 4. It'll show an empty state until real posts exist, which is expected and not a bug.
- **Drawers are real links:** each drawer is a `<Link href="/feed?category=slug">`, not a button with a `router.push` handler — standard Next.js navigation, works with the browser's native link affordances (open in new tab, etc.).
- **Accessibility:** a `usePrefersReducedMotion()` hook checks `window.matchMedia('(prefers-reduced-motion: reduce)')` once on mount; when true, the hero skips straight to its fully-open, drawers-out end state with no animated transitions.

## Architecture

### Dependencies
No new dependencies — `framer-motion` is already installed (Phase 1).

### Component structure
- `app/page.tsx` (replacing the Phase 1 placeholder): server component that fetches the 6 most recent posts, then renders `<ToolboxHero />` (client) and `<RecentPostsStrip posts={...} />` (server, since it just renders static markup from already-fetched data)
- `components/ToolboxHero.tsx` (new, client component — `"use client"` required for Framer Motion): owns the full open-sequence animation
- `components/RecentPostsStrip.tsx` (new, server component): renders the "HOT OFF THE WORKBENCH" heading and horizontal scroll strip, or the empty state
- `lib/hooks/use-prefers-reduced-motion.ts` (new): the accessibility hook described above

### `ToolboxHero` behavior
- Local state: `stage: "closed" | "opening" | "open"`, initialized to `"open"` immediately if `usePrefersReducedMotion()` is true (skips animation entirely), else `"closed"`
- Renders title ("THE TOOLBOX") + tagline ("Build Something Worth Nailing") always visible above the toolbox area
- `stage === "closed"`: renders the Unsplash closed-toolbox photo (`https://images.unsplash.com/photo-1581244277943-fe4a9c777540`) in a container with 3D `perspective`, using Framer Motion to animate on mount (`initial` → `animate`: `rotateX: 0 → -40`, `opacity: 1 → 0`), with `onAnimationComplete` transitioning `stage` to `"opening"` then immediately `"open"` (or directly to `"open"` — the "opening" stage exists conceptually to gate the photo-to-CSS-toolbox swap, not to add a separate visible frame)
- `stage === "open"`: renders the CSS-built toolbox body (a `bg-toolbox-red` container with chrome-colored border/shadow accents) containing four drawers as a `motion.div` parent with `variants` defining `staggerChildren: 0.15`, each drawer a `motion.div` child animating in (`opacity`/`y` or `x` translate) with the four category labels and slugs:
  - `PROJECTS` → `projects`
  - `TIPS & TECHNIQUES` → `tips-techniques`
  - `TOOL TALK` → `tool-talk`
  - `PLANS & BLUEPRINTS` → `plans-blueprints`
- Each drawer: red panel background, a chrome-colored handle (small CSS element), white Bebas Neue label, wrapped in `<Link href={`/feed?category=${slug}`}>`. `whileHover` variant slides the drawer further out (increase translate distance) and deepens `box-shadow`.
- When `usePrefersReducedMotion()` is true, `stage` starts at `"open"` and the drawer `motion.div`s render with their animations disabled (Framer Motion's `initial={false}` or matching `animate`/`initial` values) so nothing moves — the end state renders immediately.

### `RecentPostsStrip` behavior
- Props: `posts: Post[]` (using the `Post` type from `lib/types.ts`, Phase 1)
- If `posts.length === 0`: renders "Nothing nailed yet — be the first to share a project" with a link to `/post/new`
- Else: "HOT OFF THE WORKBENCH" heading (Bebas Neue) + a horizontally-scrolling flex row (`overflow-x-auto`) of minimal thumbnail cards — each just the post's `image_url` (via `next/image`, already configured for Supabase Storage in Phase 1's `next.config.mjs`) and `title`, wrapped in a link to `/post/[id]`

### Data fetching
`app/page.tsx` uses the existing `lib/supabase/server.ts` client to query:
```
supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(6)
```
This is a public read (RLS policy `posts_select_all` from Phase 1 already allows it, no auth required), consistent with the homepage being accessible to logged-out visitors.

## Testing / verification

- `npm run build` succeeds with no type errors
- Manual check: `/` loads, animation plays once on load (title/tagline → photo → tilt-away → toolbox body → drawers stagger in)
- Each drawer navigates to `/feed?category=[correct-slug]` on click
- Hovering a drawer visibly slides it further out with a deepened shadow
- With OS-level "reduce motion" enabled (or via browser devtools emulation), the hero renders immediately in its open, drawers-out state with no animation
- The recent posts strip renders the empty state (since no posts exist yet in this dev environment)

## Open questions

None — resolved during brainstorming.
