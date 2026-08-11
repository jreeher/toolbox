# The Toolbox

A woodworking community platform — "Pinterest for woodworkers." Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Supabase.

## Status

Phase 1 (Foundation) complete: design system, routing shell, Supabase wiring, and database schema are in place. Features (auth, feed, posts, boards, search) land in later phases — see `docs/superpowers/specs/`.

## Setup

1. Make sure you have Node.js 22+ installed (required by `@supabase/ssr` and `@supabase/supabase-js`).

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a Supabase project at [supabase.com](https://supabase.com) if you don't have one yet.

4. Copy `.env.example` to `.env.local` and fill in your project's values (Project Settings → API in the Supabase dashboard):

   ```bash
   cp .env.example .env.local
   ```

   - `NEXT_PUBLIC_SUPABASE_URL` — your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your project's anon/public key (labeled "Publishable key" in newer Supabase dashboards)
   - `SUPABASE_SERVICE_ROLE_KEY` — your project's service role key (labeled "Secret key" in newer Supabase dashboards; server-side only, keep secret)

5. Apply the database migration: open the Supabase Dashboard → SQL Editor, paste the contents of `supabase/migrations/0001_init.sql`, and run it. This creates all tables, enables RLS, adds the nail/upvote count triggers, the full-text search index, and the `post-images` storage bucket.

6. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `app/` — routes (App Router)
- `components/` — shared UI components
- `lib/supabase/` — Supabase browser/server client wrappers
- `lib/types.ts` — TypeScript types matching the database schema
- `supabase/migrations/` — SQL migrations
- `middleware.ts` — refreshes the Supabase session on every request
