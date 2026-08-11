# The Toolbox — Phase 1: Foundation

## Context

"The Toolbox" is a full-stack woodworking community platform ("Pinterest for woodworkers"), built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Supabase (auth + database + storage), deployed to Vercel with code on GitHub.

The full project is too large for a single spec/plan cycle, so it's split into sequential sub-projects:

1. **Foundation** (this spec) — scaffold, design system, Supabase wiring, DB schema, base structure
2. Auth & Profiles
3. Homepage & Toolbox Animation
4. Post Creation & Feed
5. Post Detail & Comments
6. Nailing & Boards
7. Social & Search
8. Polish

This spec covers Phase 1 only. Later phases build on top of this foundation and will each get their own spec.

## Goals

- A running Next.js app with the full design system in place (colors, fonts, background, wood-grain texture, sharp-corner button scale)
- Supabase client/server/middleware wiring following the current `@supabase/ssr` pattern
- The complete database schema as one migration file, with RLS enabled and vote/nail count triggers working
- Placeholder routes for every page in the final app, so navigation can be smoke-tested end to end
- `.env.example` and `README.md` so the project is runnable by anyone who clones it and supplies their own Supabase credentials

## Non-goals (deferred to later phases)

- Actual auth flows (signup/login/onboarding) — Phase 2
- Toolbox open/drawer animation — Phase 3
- Post creation, feed rendering, masonry — Phase 4
- Comments, related posts — Phase 5
- Nail button, boards — Phase 6
- Follow/unfollow, search UI (though the DB tsvector column is created now to avoid a later migration) — Phase 7
- Loading skeletons, error boundaries, mobile nav drawer — Phase 8

## Decisions

- **Package manager:** npm
- **Git:** `git init` + local commits only in this phase. No GitHub repo creation, no Vercel connection — user will do this later.
- **Secrets:** Not handled in chat. `.env.example` ships with placeholder keys; the user creates their own `.env.local` with real Supabase credentials.
- **Supabase client library:** `@supabase/ssr` (current recommended package, not the deprecated `auth-helpers-nextjs`).
- **Types:** Hand-written TypeScript interfaces in `lib/types.ts` matching the schema, rather than `supabase gen types` (project isn't CLI-linked yet).

## Architecture

### Project scaffold
- `create-next-app` — TypeScript, Tailwind, App Router, ESLint, no `src/` directory (routes live at `/app` per the target project structure)
- Dependencies: `@supabase/ssr`, `@supabase/supabase-js`, `framer-motion`, `lucide-react`
- `next.config.js`: `images.remotePatterns` allowing `images.unsplash.com` and the Supabase storage domain

### Design system
- `app/globals.css` defines the 8 CSS variables on `:root`:
  `--toolbox-red`, `--toolbox-dark-red`, `--chrome`, `--dark-chrome`, `--wood`, `--wood-dark`, `--charcoal`, `--off-white`
- Fonts loaded via `next/font/google` (Bebas Neue for headings, Inter for body), exposed as CSS variables (`--font-heading`, `--font-body`) and applied in `app/layout.tsx`
- `tailwind.config.ts` extended with:
  - `colors` mapped to the CSS variables above
  - `fontFamily.heading` / `fontFamily.body`
  - `borderRadius` scale capped at 4px (no pill buttons anywhere in the design system)
- Fixed background: a single `<div>` in the root layout rendering the Unsplash woodshop image (`background-attachment: fixed`, `opacity: 0.3`) over `var(--charcoal)`, shared by all pages rather than repeated per-page
- `.bg-wood-grain` utility class in `globals.css`: a repeating CSS gradient pattern for card textures, defined once and reused wherever cards need the wood-grain look

### Supabase wiring
- `lib/supabase/client.ts` — browser client via `createBrowserClient`
- `lib/supabase/server.ts` — server client via `createServerClient`, cookie-based, for use in Server Components and Server Actions
- `middleware.ts` (project root) — refreshes the Supabase session on every request, following the standard SSR middleware pattern
- `lib/types.ts` — TypeScript interfaces for all 7 tables (`Profile`, `Post`, `Nail`, `Board`, `Follow`, `Comment`, `Upvote`), matching the schema exactly

### Database migration
Single file: `supabase/migrations/0001_init.sql`

- All 7 tables as specified: `profiles`, `posts`, `nails`, `boards`, `follows`, `comments`, `upvotes`
- RLS enabled on every table
- Policies:
  - Public read: `profiles`, `posts`, `boards` (where `is_public = true`), `comments`
  - Owner-only insert/update/delete: `profiles`, `posts`, `boards`, `comments` (via `auth.uid() = user_id`)
  - `nails`, `upvotes`, `follows`: insertable/deletable only by the acting user (`auth.uid() = user_id` / `auth.uid() = follower_id`), readable publicly (needed for counts and follow-state checks)
- Triggers:
  - `AFTER INSERT OR DELETE` on `nails` → updates `posts.nail_count`
  - `AFTER INSERT OR DELETE` on `upvotes` → updates `posts.upvote_count`
- Search: a generated `tsvector` column on `posts` (title + description) with a GIN index, created now so Phase 7 doesn't need a follow-up migration
- Storage: policy for the `post-images` bucket — public read, authenticated write (created via SQL if supported by the project's Supabase version, otherwise documented as a manual dashboard step in the README)

### Base structure
- `app/layout.tsx` — root layout: fonts, fixed background layer, `<ToolboxNav />` placeholder (static markup only; interactivity added in Phase 2/3)
- Placeholder `page.tsx` for every route in the target structure, so routing can be verified before features are built:
  - `(auth)/login`, `(auth)/signup`, `onboarding`
  - `feed`, `post/[id]`, `post/new`
  - `u/[username]`, `u/[username]/boards`, `boards/[id]`
  - `search`
- `README.md` — setup instructions: env vars, running the migration, `npm run dev`
- `.env.example` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Testing / verification

- `npm run dev` starts cleanly with no console errors
- Every placeholder route resolves (manual click-through or a quick script hitting each path)
- `npm run build` succeeds (type-checks the hand-written `lib/types.ts` against usage)
- Migration file applies cleanly against a fresh Supabase project (user runs it via SQL editor or CLI; not automated in this phase since no project is CLI-linked)

## Open questions

None — resolved during brainstorming.
