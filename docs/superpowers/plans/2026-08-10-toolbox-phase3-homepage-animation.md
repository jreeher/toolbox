# The Toolbox — Phase 3: Homepage & Toolbox Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Phase 1 homepage placeholder with the real animated toolbox hero (photo tilts away → CSS toolbox revealed → drawers stagger in, each linking to `/feed?category=slug`) and a "HOT OFF THE WORKBENCH" strip of the 6 most recent posts.

**Architecture:** `app/page.tsx` (server component) fetches the 6 most recent posts and composes `<ToolboxHero />` (client, owns the Framer Motion sequence) and `<RecentPostsStrip />` (server, renders fetched data). A small `<ToolboxDrawer />` client component handles one drawer's render + hover + link. A `usePrefersReducedMotion()` hook gates all animation.

**Tech Stack:** Next.js 14 (App Router), `framer-motion` (already installed, Phase 1), `next/image` (Unsplash + Supabase Storage already allowed in `next.config.mjs`, Phase 1).

---

## Task 1: usePrefersReducedMotion hook

**Files:**
- Create: `lib/hooks/use-prefers-reduced-motion.ts`

- [ ] **Step 1: Create lib/hooks/use-prefers-reduced-motion.ts**

```ts
"use client";

import { useEffect, useState } from "react";

function getPrefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    getPrefersReducedMotion
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function handleChange(event: MediaQueryListEvent) {
      setPrefersReducedMotion(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}
```

## Context for this task

This is a new `lib/hooks/` directory (doesn't exist yet — create it). The `useState(getPrefersReducedMotion)` lazy-initializer form (passing the function itself, not calling it) means React runs `getPrefersReducedMotion()` once during the component's first render on the client, avoiding a one-frame flash where the wrong initial value would be used before a `useEffect` could correct it. The `useEffect` below only handles the media query's value *changing* after mount (e.g., the user toggles their OS setting while the tab is open) — a nice-to-have, not the primary mechanism.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds (hook isn't used yet — later tasks consume it).

- [ ] **Step 3: Commit**

```bash
git add lib/hooks/use-prefers-reduced-motion.ts
git commit -m "Add usePrefersReducedMotion hook for accessible animation gating"
```

---

## Task 2: ToolboxDrawer component

**Files:**
- Create: `components/ToolboxDrawer.tsx`

- [ ] **Step 1: Create components/ToolboxDrawer.tsx**

```tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface ToolboxDrawerProps {
  label: string;
  slug: string;
  reducedMotion: boolean;
}

const drawerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

export function ToolboxDrawer({ label, slug, reducedMotion }: ToolboxDrawerProps) {
  return (
    <motion.div
      variants={reducedMotion ? undefined : drawerVariants}
      initial={reducedMotion ? false : "hidden"}
      animate={reducedMotion ? false : "visible"}
      whileHover={{ y: 8, boxShadow: "0 12px 24px rgba(0,0,0,0.4)" }}
      className="relative"
    >
      <Link
        href={`/feed?category=${slug}`}
        className="flex flex-col items-center justify-center gap-2 bg-toolbox-red border-2 border-chrome rounded h-24 px-4 shadow-md"
      >
        <span className="w-12 h-1.5 bg-chrome rounded" aria-hidden="true" />
        <span className="font-heading text-lg text-off-white tracking-wide text-center">
          {label}
        </span>
      </Link>
    </motion.div>
  );
}
```

## Context for this task

This is Task 2 of the "Phase 3: Homepage & Toolbox Animation" plan for "The Toolbox," on branch `phase-3-homepage-animation` (to be created) in `C:\Users\jreeh\Desktop\Tool Box`, branched from `master`. Task 1 (the reduced-motion hook) is complete. This component isn't wired into any page yet — Task 3 (`ToolboxHero`) renders four of these. The `reducedMotion` prop is threaded in from the parent rather than each drawer calling `usePrefersReducedMotion()` itself, so all four drawers (and the hero's own photo/container animations) stay in sync from a single source of truth.

The `w-12 h-1.5 bg-chrome rounded` span is the drawer's "chrome handle" — a small decorative bar, marked `aria-hidden="true"` since it conveys no information beyond the visible label text next to it.

## Before You Begin

If you have questions, ask them now.

## Your Job

1. Create `components/ToolboxDrawer.tsx` exactly as specified
2. Verify `npm run build` succeeds
3. Commit
4. Self-review
5. Report back

Work from: `C:\Users\jreeh\Desktop\Tool Box`

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds (component isn't used yet until Task 3).

- [ ] **Step 3: Commit**

```bash
git add components/ToolboxDrawer.tsx
git commit -m "Add ToolboxDrawer component: category link with hover and stagger-in animation"
```

---

## Task 3: ToolboxHero component

**Files:**
- Create: `components/ToolboxHero.tsx`

- [ ] **Step 1: Create components/ToolboxHero.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";
import { ToolboxDrawer } from "@/components/ToolboxDrawer";

type Stage = "closed" | "open";

const DRAWERS = [
  { label: "PROJECTS", slug: "projects" },
  { label: "TIPS & TECHNIQUES", slug: "tips-techniques" },
  { label: "TOOL TALK", slug: "tool-talk" },
  { label: "PLANS & BLUEPRINTS", slug: "plans-blueprints" },
];

const drawersContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export function ToolboxHero() {
  const reducedMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState<Stage>("closed");

  useEffect(() => {
    if (reducedMotion) {
      setStage("open");
    }
  }, [reducedMotion]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16 px-4">
      <div className="text-center">
        <h1 className="font-heading text-6xl text-toolbox-red">THE TOOLBOX</h1>
        <p className="font-body text-lg text-off-white mt-2">
          Build Something Worth Nailing
        </p>
      </div>

      <div style={{ perspective: 1000 }} className="relative w-full max-w-md h-64">
        {stage === "closed" && (
          <motion.div
            initial={{ rotateX: 0, opacity: 1 }}
            animate={{ rotateX: -40, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            onAnimationComplete={() => setStage("open")}
            style={{ transformOrigin: "top center" }}
            className="absolute inset-0 rounded overflow-hidden"
          >
            <Image
              src="https://images.unsplash.com/photo-1581244277943-fe4a9c777540"
              alt="A closed red toolbox"
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        )}

        {stage === "open" && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-toolbox-red border-2 border-chrome rounded p-6 h-full flex flex-col justify-end"
          >
            <motion.div
              variants={reducedMotion ? undefined : drawersContainerVariants}
              initial={reducedMotion ? false : "hidden"}
              animate={reducedMotion ? false : "visible"}
              className="grid grid-cols-2 gap-4"
            >
              {DRAWERS.map((drawer) => (
                <ToolboxDrawer
                  key={drawer.slug}
                  label={drawer.label}
                  slug={drawer.slug}
                  reducedMotion={reducedMotion}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
```

## Context for this task

This is Task 3, building on Tasks 1-2 (the reduced-motion hook and `ToolboxDrawer`). The design spec's conceptual 3-stage machine (`closed` → `opening` → `open`) is implemented here as 2 rendered states (`closed`, `open`) — this is intentional, not a simplification error: the spec itself notes "the 'opening' stage exists conceptually to gate the photo-to-CSS-toolbox swap, not to add a separate visible frame." The photo's own tilt-and-fade animation IS the visible "opening" transition; there's no need for a third distinct rendered state.

`onAnimationComplete` on the photo's `motion.div` fires once the `rotateX`/`opacity` animation finishes, calling `setStage("open")` — this swaps the closed-photo markup out and the CSS toolbox body + drawers in. This is the state-machine-via-callback pattern the spec calls for, not a fixed `setTimeout`.

**Hydration safety:** `stage` always initializes to `"closed"`, matching what the server renders (Task 1's `usePrefersReducedMotion()` returns `false` during SSR by design, since `window` doesn't exist there). If it initialized to `reducedMotion ? "open" : "closed"` directly, a client whose real preference is `true` would compute a different value on its first render than the server did, causing a React hydration mismatch — this exact risk was flagged during Task 1's code review. Instead, a `useEffect` (which only runs after hydration completes) checks `reducedMotion` and flips `stage` to `"open"` post-mount if needed. This means reduced-motion users see one harmless render frame of the closed-photo state before it's immediately replaced — imperceptible in practice, and safe. Once `stage` is `"open"`, every `motion.div` in that tree uses `initial={false}` so Framer Motion renders them in their final visual state immediately with no transition. `ToolboxDrawer` (Task 2) already implements this same `reducedMotion` branching for its own `variants`/`initial`/`animate` props — this component just threads the same boolean down to all four. Because `ToolboxDrawer` only ever renders once `stage === "open"`, and `stage` starts `"closed"` on both server and client, `ToolboxDrawer` itself is never part of the initial SSR/hydration render — it only mounts client-side afterward, so it carries no hydration-mismatch risk of its own.

`next/image` with `fill` requires a positioned parent with defined dimensions — the parent `motion.div` here has `className="absolute inset-0 rounded overflow-hidden"` inside the outer `relative w-full max-w-md h-64` container, satisfying that requirement. `priority` is set since this is the largest above-the-fold image on the homepage.

The `images.unsplash.com` hostname is already allowlisted in `next.config.mjs` (Phase 1), so no config change is needed here.

## Before You Begin

If you have questions, ask them now.

## Your Job

1. Create `components/ToolboxHero.tsx` exactly as specified
2. Verify `npm run build` succeeds
3. Commit
4. Self-review
5. Report back

Work from: `C:\Users\jreeh\Desktop\Tool Box`

## When You're in Over Your Head

Escalate with BLOCKED or NEEDS_CONTEXT if Framer Motion's API doesn't behave as expected with the installed version, or if TypeScript complains about the `variants`/`initial` conditional typing in a way that isn't obviously fixable.

## Before Reporting Back: Self-Review

- Does the file match the spec exactly?
- Does `npm run build` succeed?
- Is the commit scoped to only this one file?

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds (component isn't rendered by any page yet until Task 5).

- [ ] **Step 3: Commit**

```bash
git add components/ToolboxHero.tsx
git commit -m "Add ToolboxHero: photo-tilt-open animation and staggered drawer reveal"
```

## Report Format

- **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- What you implemented
- What you tested and test results
- Files changed
- Self-review findings
- Any issues or concerns
- The git commit SHA

---

## Task 4: RecentPostsStrip component

**Files:**
- Create: `components/RecentPostsStrip.tsx`

- [ ] **Step 1: Create components/RecentPostsStrip.tsx**

```tsx
import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/types";

interface RecentPostsStripProps {
  posts: Post[];
}

export function RecentPostsStrip({ posts }: RecentPostsStripProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="font-body text-off-white text-sm">
          Nothing nailed yet — be the first to share a project.
        </p>
        <Link
          href="/post/new"
          className="inline-block mt-4 bg-toolbox-red text-off-white text-sm px-4 py-2 rounded"
        >
          Share a Project
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <h2 className="font-heading text-3xl text-toolbox-red mb-4 text-center">
        HOT OFF THE WORKBENCH
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {posts.map((post) => (
          <Link key={post.id} href={`/post/${post.id}`} className="flex-shrink-0 w-40">
            <div className="relative w-40 h-40 rounded overflow-hidden border border-chrome">
              <Image src={post.image_url} alt={post.title} fill className="object-cover" />
            </div>
            <p className="font-body text-off-white text-sm mt-2 truncate">{post.title}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

## Context for this task

This is Task 4, independent of Tasks 1-3 (no shared code) — it's a plain server component, no `"use client"` needed since it renders static markup from already-fetched props with no interactivity beyond native `<Link>` navigation. `Post` is imported from `lib/types.ts` (Phase 1). This component isn't wired into any page yet — Task 5 (`app/page.tsx`) fetches posts and passes them in.

The empty-state branch (`posts.length === 0`) is the one that will actually render in this dev environment, since no posts exist until Phase 4. Both branches are real, intentional code paths — not one live and one dead.

## Before You Begin

If you have questions, ask them now.

## Your Job

1. Create `components/RecentPostsStrip.tsx` exactly as specified
2. Verify `npm run build` succeeds
3. Commit
4. Self-review
5. Report back

Work from: `C:\Users\jreeh\Desktop\Tool Box`

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/RecentPostsStrip.tsx
git commit -m "Add RecentPostsStrip component with empty state"
```

## Report Format

- **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- What you implemented
- What you tested and test results
- Files changed
- Self-review findings
- Any issues or concerns
- The git commit SHA

---

## Task 5: Wire up app/page.tsx

**Files:**
- Modify: `app/page.tsx` (replacing the Phase 1 placeholder)

- [ ] **Step 1: Replace app/page.tsx**

```tsx
import { createClient } from "@/lib/supabase/server";
import { ToolboxHero } from "@/components/ToolboxHero";
import { RecentPostsStrip } from "@/components/RecentPostsStrip";
import type { Post } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div>
      <ToolboxHero />
      <RecentPostsStrip posts={(posts as Post[]) ?? []} />
    </div>
  );
}
```

## Context for this task

This is the final content task. Tasks 1-4 (hook, drawer, hero, recent-posts strip) are all complete. `app/page.tsx` currently has the Phase 1 placeholder (static "THE TOOLBOX" heading + tagline, no animation, no data fetching) — this task replaces it entirely, composing the two components built in this phase.

The query `supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(6)` relies on the `posts_select_all` RLS policy from Phase 1's migration (`using (true)`), which allows public, unauthenticated reads — correct for a homepage visible to logged-out visitors. `(posts as Post[]) ?? []` handles both the "query returned null due to an error" case and the normal "empty array, no posts yet" case by falling back to an empty array either way, which `RecentPostsStrip` already renders correctly as its empty state.

Making `app/page.tsx` fetch data via `createClient()` (which reads cookies) means `/` joins the rest of the app in being dynamically rendered — consistent with the app-wide dynamic-rendering trade-off already established in Phase 2 (session-aware `ToolboxNav` in the root layout already forced every route dynamic), so this isn't a new trade-off, just confirming the existing one still holds.

## Before You Begin

If you have questions, ask them now.

## Your Job

1. Replace `app/page.tsx` exactly as specified
2. Verify `npm run build` succeeds
3. Commit
4. Self-review
5. Report back

Work from: `C:\Users\jreeh\Desktop\Tool Box`

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "Wire up animated homepage: ToolboxHero + RecentPostsStrip with real post query"
```

## Report Format

- **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- What you implemented
- What you tested and test results
- Files changed
- Self-review findings
- Any issues or concerns
- The git commit SHA

---

## Task 6: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Clean build**

```bash
npm run build
```

Expected: succeeds with zero type errors.

- [ ] **Step 2: Confirm no secrets are tracked**

```bash
git status
git ls-files | grep -i env
```

Expected: only `.env.example` tracked, `.env.local` absent.

- [ ] **Step 3: Confirm git history**

```bash
git log --oneline -6
```

Expected: one commit per task, in order.

- [ ] **Step 4: Document manual verification steps for the user**

Since there's no live Supabase project connected in this development environment for a real browser check, and no automated visual/animation test tooling in this project, note the following for the user to verify manually once they run `npm run dev` locally:

1. `/` loads: title + tagline visible, closed-toolbox photo shown, then tilts away and fades, revealing the open toolbox body with four drawers staggering in
2. Each drawer navigates to `/feed?category=[correct-slug]` on click (verify the URL's query param matches: projects, tips-techniques, tool-talk, plans-blueprints)
3. Hovering a drawer slides it further out with a deepened shadow
4. With the OS or browser devtools "reduce motion" setting enabled, reload `/` — the hero should appear immediately in its fully-open, drawers-out state with no animated transition
5. The "HOT OFF THE WORKBENCH" section shows the empty state ("Nothing nailed yet...") since no posts exist yet

- [ ] **Step 5: Final commit (if anything changed during verification)**

```bash
git add -A
git commit -m "Phase 3 homepage animation complete: verify clean build and no tracked secrets"
```

(Skip if nothing to commit.)

---

## Plan self-review notes

- **Spec coverage:** every Phase 3 spec section (hero animation sequence, drawer hover/links, recent posts strip with empty state, reduced-motion accessibility) maps to Tasks 1–5; Task 6 covers the spec's "Testing / verification" section, with the live-browser-dependent animation checks explicitly called out as manual follow-up.
- **Deferred items** (full `PostCard`, real `/feed` filtering) are explicitly out of scope per the spec's non-goals and are not stubbed beyond what's needed for links to resolve (they already resolve, per Phase 1's placeholder routes).
- **Type consistency:** `Post` type (from `lib/types.ts`, Phase 1) is used consistently between `app/page.tsx`'s query result cast and `RecentPostsStrip`'s props. The four drawer `{ label, slug }` pairs in `ToolboxHero` use the exact category slugs (`projects`, `tips-techniques`, `tool-talk`, `plans-blueprints`) matching the `posts.category` check constraint from Phase 1's migration and the `PostCategory` union in `lib/types.ts` — no drift between the drawer links and the actual category values the database accepts.
