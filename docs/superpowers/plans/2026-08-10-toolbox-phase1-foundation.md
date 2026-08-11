# The Toolbox — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a running Next.js 14 app with the full Toolbox design system, Supabase client/server/middleware wiring, the complete database migration (schema + RLS + triggers), and placeholder routes for every page in the final product.

**Architecture:** A single Next.js App Router project at the repo root (`/app`, `/components`, `/lib`, `/supabase`). Design tokens live as CSS variables in `globals.css`, mapped into Tailwind's theme. Supabase access goes through three small wrapper modules (`lib/supabase/client.ts`, `server.ts`, and root `middleware.ts`) following the current `@supabase/ssr` pattern. The database is defined in one migration file applied manually via the Supabase SQL editor (no CLI link in this phase).

**Tech Stack:** Next.js 14 (App Router, TypeScript), Tailwind CSS, `@supabase/ssr`, `@supabase/supabase-js`, `framer-motion`, `lucide-react`, npm.

---

## Task 1: Scaffold the Next.js project

**Files:**
- Create: entire project scaffold via `create-next-app` (root: `C:\Users\jreeh\Desktop\Tool Box`)

- [ ] **Step 1: Run create-next-app**

Run (answer prompts as shown — pass flags to skip prompts):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```

If it warns the directory isn't empty (it will contain `docs/`), confirm proceeding — it only adds files, it won't touch `docs/`.

- [ ] **Step 2: Verify the dev server boots**

Run: `npm run dev` (in background / separate terminal), then in another shell:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: `200`. Stop the dev server after confirming.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js 14 app with TypeScript and Tailwind"
```

---

## Task 2: Install additional dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install @supabase/ssr @supabase/supabase-js framer-motion lucide-react
```

- [ ] **Step 2: Verify install**

Run: `npm ls @supabase/ssr @supabase/supabase-js framer-motion lucide-react`
Expected: all four listed with resolved versions, no `UNMET DEPENDENCY` errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add Supabase, Framer Motion, and lucide-react dependencies"
```

---

## Task 3: Configure next.config.js for remote images

**Files:**
- Modify: `next.config.js` (or `.mjs`/`.ts`, whatever `create-next-app` generated)

- [ ] **Step 1: Check the generated config filename**

Run: `ls next.config.*`

- [ ] **Step 2: Update the config**

Replace its contents with (adjust export syntax to match the generated file's module format — CommonJS shown, since `create-next-app` with `--eslint --app` defaults to `next.config.mjs`; if `.mjs`, use `export default` instead of `module.exports`):

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;
```

If the file is `next.config.mjs`, use:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 3: Verify it parses**

Run: `npm run build`
Expected: build succeeds (routes are still the default `create-next-app` page at this point — that's fine).

- [ ] **Step 4: Commit**

```bash
git add next.config.*
git commit -m "Allow remote images from Unsplash and Supabase storage"
```

---

## Task 4: Design system — CSS variables, fonts, Tailwind theme

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Replace app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --toolbox-red: #C0392B;
  --toolbox-dark-red: #922B21;
  --chrome: #BDC3C7;
  --dark-chrome: #7F8C8D;
  --wood: #8B5E3C;
  --wood-dark: #5D3A1A;
  --charcoal: #1C1C1C;
  --off-white: #F5F0EB;
}

body {
  color: var(--off-white);
  background-color: var(--charcoal);
}

.bg-wood-grain {
  background-color: var(--wood);
  background-image: repeating-linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.08) 0px,
    rgba(0, 0, 0, 0.08) 2px,
    transparent 2px,
    transparent 8px
  ), repeating-linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 0px,
    rgba(255, 255, 255, 0.03) 1px,
    transparent 1px,
    transparent 20px
  );
}
```

- [ ] **Step 2: Replace tailwind.config.ts**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "toolbox-red": "var(--toolbox-red)",
        "toolbox-dark-red": "var(--toolbox-dark-red)",
        chrome: "var(--chrome)",
        "dark-chrome": "var(--dark-chrome)",
        wood: "var(--wood)",
        "wood-dark": "var(--wood-dark)",
        charcoal: "var(--charcoal)",
        "off-white": "var(--off-white)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "2px",
        md: "4px",
        lg: "4px",
        xl: "4px",
        full: "4px",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 3: Verify build still passes**

Run: `npm run build`
Expected: succeeds with no Tailwind config errors.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css tailwind.config.ts
git commit -m "Add Toolbox design system: CSS variables, wood-grain texture, sharp-corner scale"
```

---

## Task 5: Supabase client, server, and middleware wrappers

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Create lib/supabase/client.ts**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create lib/supabase/server.ts**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore
            // because middleware refreshes the session on every request.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create middleware.ts at project root**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 4: Add env vars to .env.local for local verification**

Create `.env.local` (gitignored by default from `create-next-app`) with placeholder values so the build type-checks:

```
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key
```

Tell the user to replace these with their real project's values before running the app against live data.

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: succeeds, no type errors in the three new files.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase/client.ts lib/supabase/server.ts middleware.ts
git commit -m "Wire Supabase browser client, server client, and session-refresh middleware"
```

(`.env.local` stays uncommitted — it's in `.gitignore` by default.)

---

## Task 6: Shared TypeScript types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Create lib/types.ts**

```ts
export type PostCategory =
  | "projects"
  | "tips-techniques"
  | "tool-talk"
  | "plans-blueprints";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: PostCategory;
  subcategory: string | null;
  image_url: string;
  upvote_count: number;
  nail_count: number;
  created_at: string;
}

export interface Nail {
  id: string;
  user_id: string;
  post_id: string;
  board_id: string | null;
  created_at: string;
}

export interface Board {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
}

export interface Upvote {
  user_id: string;
  post_id: string;
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "Add shared TypeScript types for all database tables"
```

---

## Task 7: Database migration (schema, RLS, triggers, search index, storage policy)

**Files:**
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 0001_init.sql — The Toolbox: initial schema, RLS, triggers, search index, storage policy

create extension if not exists pgcrypto;

-- ── Tables ──────────────────────────────────────────────────────────────

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

create table boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  description text,
  is_public bool not null default true,
  created_at timestamptz not null default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null check (category in ('projects', 'tips-techniques', 'tool-talk', 'plans-blueprints')),
  subcategory text,
  image_url text not null,
  upvote_count int not null default 0,
  nail_count int not null default 0,
  created_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored
);

create index posts_search_idx on posts using gin (search_vector);
create index posts_category_idx on posts (category);
create index posts_created_at_idx on posts (created_at desc);

create table nails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  board_id uuid references boards(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create table follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  primary key (follower_id, following_id)
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table upvotes (
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  primary key (user_id, post_id)
);

-- ── Row Level Security ──────────────────────────────────────────────────

alter table profiles enable row level security;
alter table posts enable row level security;
alter table boards enable row level security;
alter table nails enable row level security;
alter table follows enable row level security;
alter table comments enable row level security;
alter table upvotes enable row level security;

-- profiles: public read, owner write
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- posts: public read, owner write/update/delete
create policy "posts_select_all" on posts for select using (true);
create policy "posts_insert_own" on posts for insert with check (auth.uid() = user_id);
create policy "posts_update_own" on posts for update using (auth.uid() = user_id);
create policy "posts_delete_own" on posts for delete using (auth.uid() = user_id);

-- boards: public boards readable by anyone, private boards readable by owner only
create policy "boards_select_public_or_own" on boards for select using (is_public = true or auth.uid() = user_id);
create policy "boards_insert_own" on boards for insert with check (auth.uid() = user_id);
create policy "boards_update_own" on boards for update using (auth.uid() = user_id);
create policy "boards_delete_own" on boards for delete using (auth.uid() = user_id);

-- nails: readable by anyone (needed for public nail counts), owner manages their own rows
create policy "nails_select_all" on nails for select using (true);
create policy "nails_insert_own" on nails for insert with check (auth.uid() = user_id);
create policy "nails_delete_own" on nails for delete using (auth.uid() = user_id);

-- follows: readable by anyone (needed for follower/following counts), owner manages their own edges
create policy "follows_select_all" on follows for select using (true);
create policy "follows_insert_own" on follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete_own" on follows for delete using (auth.uid() = follower_id);

-- comments: public read, owner write/update/delete
create policy "comments_select_all" on comments for select using (true);
create policy "comments_insert_own" on comments for insert with check (auth.uid() = user_id);
create policy "comments_update_own" on comments for update using (auth.uid() = user_id);
create policy "comments_delete_own" on comments for delete using (auth.uid() = user_id);

-- upvotes: readable by anyone (needed for public upvote counts), owner manages their own rows
create policy "upvotes_select_all" on upvotes for select using (true);
create policy "upvotes_insert_own" on upvotes for insert with check (auth.uid() = user_id);
create policy "upvotes_delete_own" on upvotes for delete using (auth.uid() = user_id);

-- ── Triggers: keep posts.nail_count / posts.upvote_count in sync ────────

create or replace function public.handle_nail_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    update posts set nail_count = nail_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update posts set nail_count = nail_count - 1 where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_nail_change
after insert or delete on nails
for each row execute function public.handle_nail_count();

create or replace function public.handle_upvote_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    update posts set upvote_count = upvote_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update posts set upvote_count = upvote_count - 1 where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_upvote_change
after insert or delete on upvotes
for each row execute function public.handle_upvote_count();

-- ── Storage: post-images bucket ──────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "post_images_public_read"
on storage.objects for select
using (bucket_id = 'post-images');

create policy "post_images_authenticated_upload"
on storage.objects for insert
with check (bucket_id = 'post-images' and auth.role() = 'authenticated');
```

- [ ] **Step 2: Verify SQL syntax (offline check)**

There's no local Postgres in this phase, so verification is structural: re-read the file and confirm every `references` target is declared earlier in the file (tables must be created in dependency order — `profiles` → `boards` → `posts` → `nails`/`follows`/`comments`/`upvotes`), and confirm every policy references a column that exists on its table. This file follows that order already.

Document in the README (Task 9) that the user applies this via the Supabase Dashboard SQL Editor (paste-and-run) or `supabase db push` if they later link the CLI.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "Add initial database migration: schema, RLS policies, count triggers, search index, storage policy"
```

---

## Task 8: Root layout — fonts, background layer, nav placeholder

**Files:**
- Create: `components/ToolboxNav.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create components/ToolboxNav.tsx (static placeholder)**

```tsx
export function ToolboxNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-charcoal border-b-2 border-chrome flex items-center justify-between px-6">
      <span className="font-heading text-2xl tracking-wide text-toolbox-red">
        THE TOOLBOX
      </span>
      <nav className="hidden md:flex gap-8 font-body text-sm text-off-white">
        <span>Feed</span>
        <span>Categories</span>
        <span>Boards</span>
      </nav>
      <div className="flex gap-3">
        <button className="border border-chrome text-off-white text-sm px-4 py-2 rounded">
          Sign In
        </button>
        <button className="bg-toolbox-red text-off-white text-sm px-4 py-2 rounded">
          Sign Up
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Replace app/layout.tsx**

```tsx
import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { ToolboxNav } from "@/components/ToolboxNav";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "The Toolbox — Build Something Worth Nailing",
  description: "A community for woodworkers to share projects, tips, and plans.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${bebasNeue.variable} ${inter.variable} font-body relative min-h-screen`}>
        <div
          className="fixed inset-0 -z-10 bg-charcoal bg-cover bg-center bg-fixed opacity-30"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1504148455328-c376907d081c)",
          }}
        />
        <ToolboxNav />
        <main className="relative pt-16">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify build and visual smoke test**

Run: `npm run build`
Expected: succeeds.

Run: `npm run dev`, then open `http://localhost:3000` in a browser (or `curl`) and confirm HTTP 200. Stop the dev server after.

- [ ] **Step 4: Commit**

```bash
git add components/ToolboxNav.tsx app/layout.tsx
git commit -m "Add root layout with fonts, fixed woodshop background, and nav placeholder"
```

---

## Task 9: Placeholder routes for every page

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`
- Create: `app/onboarding/page.tsx`
- Create: `app/feed/page.tsx`
- Create: `app/post/[id]/page.tsx`
- Create: `app/post/new/page.tsx`
- Create: `app/u/[username]/page.tsx`
- Create: `app/u/[username]/boards/page.tsx`
- Create: `app/boards/[id]/page.tsx`
- Create: `app/search/page.tsx`
- Modify: `app/page.tsx` (homepage placeholder — full toolbox animation comes in Phase 3)

Each placeholder follows the same minimal shape so routing can be verified before real content exists.

- [ ] **Step 1: Create app/(auth)/login/page.tsx**

```tsx
export default function LoginPage() {
  return <div className="p-8 font-heading text-3xl">Login — coming in Phase 2</div>;
}
```

- [ ] **Step 2: Create app/(auth)/signup/page.tsx**

```tsx
export default function SignupPage() {
  return <div className="p-8 font-heading text-3xl">Sign Up — coming in Phase 2</div>;
}
```

- [ ] **Step 3: Create app/onboarding/page.tsx**

```tsx
export default function OnboardingPage() {
  return <div className="p-8 font-heading text-3xl">Onboarding — coming in Phase 2</div>;
}
```

- [ ] **Step 4: Create app/feed/page.tsx**

```tsx
export default function FeedPage() {
  return <div className="p-8 font-heading text-3xl">Feed — coming in Phase 4</div>;
}
```

- [ ] **Step 5: Create app/post/[id]/page.tsx**

```tsx
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div className="p-8 font-heading text-3xl">Post {id} — coming in Phase 5</div>;
}
```

- [ ] **Step 6: Create app/post/new/page.tsx**

```tsx
export default function NewPostPage() {
  return <div className="p-8 font-heading text-3xl">New Post — coming in Phase 4</div>;
}
```

- [ ] **Step 7: Create app/u/[username]/page.tsx**

```tsx
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <div className="p-8 font-heading text-3xl">@{username} — coming in Phase 7</div>;
}
```

- [ ] **Step 8: Create app/u/[username]/boards/page.tsx**

```tsx
export default async function UserBoardsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <div className="p-8 font-heading text-3xl">@{username}&apos;s Boards — coming in Phase 6</div>;
}
```

- [ ] **Step 9: Create app/boards/[id]/page.tsx**

```tsx
export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div className="p-8 font-heading text-3xl">Board {id} — coming in Phase 6</div>;
}
```

- [ ] **Step 10: Create app/search/page.tsx**

```tsx
export default function SearchPage() {
  return <div className="p-8 font-heading text-3xl">Search — coming in Phase 7</div>;
}
```

- [ ] **Step 11: Replace app/page.tsx**

```tsx
export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 text-center px-4">
      <h1 className="font-heading text-6xl text-toolbox-red">THE TOOLBOX</h1>
      <p className="font-body text-lg text-off-white">Build Something Worth Nailing</p>
      <p className="font-body text-sm text-dark-chrome">Toolbox animation coming in Phase 3</p>
    </div>
  );
}
```

- [ ] **Step 12: Verify every route resolves**

Run: `npm run build` — Next.js will list every route it discovered; confirm all 11 paths appear (`/`, `/login`, `/signup`, `/onboarding`, `/feed`, `/post/[id]`, `/post/new`, `/u/[username]`, `/u/[username]/boards`, `/boards/[id]`, `/search`).

Then run: `npm run dev`, and hit each concrete URL (using a placeholder value for dynamic segments, e.g. `/post/test-id`) with curl:

```bash
for path in / /login /signup /onboarding /feed /post/test-id /post/new /u/testuser /u/testuser/boards /boards/test-id /search; do
  echo -n "$path -> "
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000$path"
done
```

Expected: every line prints `200`. Stop the dev server after.

- [ ] **Step 13: Commit**

```bash
git add app/
git commit -m "Add placeholder routes for every page in the target project structure"
```

---

## Task 10: README and .env.example

**Files:**
- Create: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Create .env.example**

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

- [ ] **Step 2: Replace README.md**

```markdown
# The Toolbox

A woodworking community platform — "Pinterest for woodworkers." Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Supabase.

## Status

Phase 1 (Foundation) complete: design system, routing shell, Supabase wiring, and database schema are in place. Features (auth, feed, posts, boards, search) land in later phases — see `docs/superpowers/specs/`.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project at [supabase.com](https://supabase.com) if you don't have one yet.

3. Copy `.env.example` to `.env.local` and fill in your project's values (Project Settings → API in the Supabase dashboard):

   ```bash
   cp .env.example .env.local
   ```

   - `NEXT_PUBLIC_SUPABASE_URL` — your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your project's anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` — your project's service role key (server-side only, keep secret)

4. Apply the database migration: open the Supabase Dashboard → SQL Editor, paste the contents of `supabase/migrations/0001_init.sql`, and run it. This creates all tables, enables RLS, adds the nail/upvote count triggers, the full-text search index, and the `post-images` storage bucket.

5. Run the dev server:

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
```

- [ ] **Step 3: Verify**

Run: `cat README.md` and confirm it renders correctly (no broken markdown); confirm `.env.example` has no real secrets in it.

- [ ] **Step 4: Commit**

```bash
git add .env.example README.md
git commit -m "Add README setup instructions and .env.example"
```

---

## Task 11: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Clean build**

```bash
npm run build
```

Expected: succeeds with zero type errors, all 11+ routes listed in the output.

- [ ] **Step 2: Confirm no secrets are tracked**

```bash
git status
git ls-files | grep -i env
```

Expected: only `.env.example` is tracked; `.env.local` does not appear in `git ls-files` output.

- [ ] **Step 3: Confirm full git history**

```bash
git log --oneline
```

Expected: one commit per task above (scaffold → dependencies → next.config → design system → supabase wiring → types → migration → layout → routes → README → this verification, if it produces a commit).

- [ ] **Step 4: Final commit (if anything changed during verification)**

```bash
git add -A
git commit -m "Phase 1 foundation complete: verify clean build and no tracked secrets"
```

(Skip this step if there's nothing to commit.)

---

## Plan self-review notes

- **Spec coverage:** every Phase 1 spec section (scaffold, design system, Supabase wiring, migration, base structure) maps to Tasks 1–10; Task 11 covers the spec's "Testing / verification" section.
- **Deferred items** (auth flows, toolbox animation, feed, etc.) are explicitly out of scope per the spec's non-goals and are not stubbed beyond placeholder text.
- **Type consistency:** `PostCategory` values in `lib/types.ts` (Task 6) match the `check` constraint in the migration (Task 7) exactly: `'projects' | 'tips-techniques' | 'tool-talk' | 'plans-blueprints'`.
