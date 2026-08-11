# The Toolbox — Phase 4: Post Creation & Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A working create-post flow (form + image upload to Supabase Storage + live preview) and a real `/feed` (masonry grid, category/sort filters via URL params, infinite scroll).

**Architecture:** Server Actions handle the Storage upload + DB insert for post creation (same pattern as Phase 2's auth forms). The feed's first page is server-rendered from `searchParams`; subsequent pages are fetched client-side via the browser Supabase client and appended on `IntersectionObserver` intersection. `PostCard` is decoupled from the raw DB row so it's reusable for both the feed and the create-post live preview.

**Tech Stack:** Next.js 14 (App Router, Server Actions), `@supabase/ssr` (Phase 1), `lucide-react` (Phase 1), `sonner` (Phase 2).

---

## Task 1: Shared category constants

**Files:**
- Create: `lib/categories.ts`

- [ ] **Step 1: Create lib/categories.ts**

```ts
import type { PostCategory } from "@/lib/types";

export const CATEGORIES: { slug: PostCategory; label: string }[] = [
  { slug: "projects", label: "Projects" },
  { slug: "tips-techniques", label: "Tips & Techniques" },
  { slug: "tool-talk", label: "Tool Talk" },
  { slug: "plans-blueprints", label: "Plans & Blueprints" },
];

export function getCategoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
```

## Context for this task

This is Task 1 of the "Phase 4: Post Creation & Feed" plan for "The Toolbox," on branch `phase-4-post-creation-feed` (to be created) in `C:\Users\jreeh\Desktop\Tool Box`, branched from `master` (which has Phases 1-3 merged). `PostCategory` already exists in `lib/types.ts` (Phase 1) as the union `"projects" | "tips-techniques" | "tool-talk" | "plans-blueprints"`. This new file centralizes the slug→label mapping so `CategoryBadge`, the feed's filter tabs, and the create-post form's category `<select>` (all built in later tasks of this phase) share one source of truth rather than each hardcoding the four labels separately.

Note: `components/ToolboxHero.tsx` (Phase 3) has its own hardcoded `DRAWERS` array with uppercase labels ("PROJECTS", etc.) for its specific stylistic purpose (Bebas Neue drawer labels) — that file is already shipped and reviewed; this task does NOT touch it or attempt to consolidate it with this new shared file. That's an intentional scope boundary, not an oversight.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds (file isn't consumed yet — later tasks import it).

- [ ] **Step 3: Commit**

```bash
git add lib/categories.ts
git commit -m "Add shared category slug-to-label mapping"
```

---

## Task 2: CategoryBadge component

**Files:**
- Create: `components/CategoryBadge.tsx`

- [ ] **Step 1: Create components/CategoryBadge.tsx**

```tsx
import { getCategoryLabel } from "@/lib/categories";

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <span className="inline-block bg-toolbox-red text-off-white text-xs font-body px-2 py-1 rounded whitespace-nowrap">
      {getCategoryLabel(category)}
    </span>
  );
}
```

## Context for this task

This is Task 2, building on Task 1's `lib/categories.ts`. Plain server component (no `"use client"` needed — no interactivity). Not consumed by any page yet — Task 4 (`PostCard`) uses it.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/CategoryBadge.tsx
git commit -m "Add CategoryBadge component"
```

---

## Task 3: MasonryGrid component

**Files:**
- Create: `components/MasonryGrid.tsx`

- [ ] **Step 1: Create components/MasonryGrid.tsx**

```tsx
import type { ReactNode } from "react";

interface MasonryGridProps {
  children: ReactNode;
}

export function MasonryGrid({ children }: MasonryGridProps) {
  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
      {children}
    </div>
  );
}
```

## Context for this task

This is Task 3, independent of Tasks 1-2. Pure CSS-columns masonry layout wrapper, per the Phase 4 design spec's decision to avoid a JS masonry library. The `[&>*]:mb-4 [&>*]:break-inside-avoid` arbitrary-variant selectors apply spacing and column-break avoidance to every direct child automatically, so callers (Task 7's feed list) don't need to add those classes to each `<PostCard />` themselves — this keeps `MasonryGrid`'s consumers simple. Not consumed by any page yet — Task 7 uses it.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/MasonryGrid.tsx
git commit -m "Add MasonryGrid component using CSS columns"
```

---

## Task 4: PostCard component

**Files:**
- Create: `components/PostCard.tsx`

- [ ] **Step 1: Create components/PostCard.tsx**

```tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Hammer, ThumbsUp, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { CategoryBadge } from "@/components/CategoryBadge";
import { Avatar } from "@/components/Avatar";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    imageUrl: string;
    category: string;
    nailCount: number;
    upvoteCount: number;
    commentCount: number;
  };
  author: {
    username: string;
    avatarUrl: string | null;
  };
}

export function PostCard({ post, author }: PostCardProps) {
  const isBlobUrl = post.imageUrl.startsWith("blob:");

  async function handleShare() {
    const url = `${window.location.origin}/post/${post.id}`;
    await navigator.clipboard.writeText(url);
    toast("Link copied to clipboard");
  }

  return (
    <div className="border-2 border-toolbox-red rounded overflow-hidden bg-charcoal transition-transform hover:scale-[1.02] hover:shadow-xl">
      <Link href={`/post/${post.id}`}>
        <div className="relative w-full aspect-[4/3] bg-wood-dark">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            unoptimized={isBlobUrl}
            className="object-cover"
          />
        </div>
      </Link>
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/post/${post.id}`}
            className="font-heading text-lg text-off-white truncate"
          >
            {post.title}
          </Link>
          <CategoryBadge category={post.category} />
        </div>
        <div className="flex items-center justify-between text-off-white text-sm">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Hammer size={14} /> {post.nailCount}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp size={14} /> {post.upvoteCount}
            </span>
            <Link href={`/post/${post.id}`} className="flex items-center gap-1">
              <MessageCircle size={14} /> {post.commentCount}
            </Link>
          </div>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Copy link to this post"
            className="flex items-center gap-1"
          >
            <Share2 size={14} />
          </button>
        </div>
        <Link href={`/u/${author.username}`} className="flex items-center gap-2 mt-1">
          <Avatar username={author.username} avatarUrl={author.avatarUrl} size={20} />
          <span className="text-off-white text-xs">{author.username}</span>
        </Link>
      </div>
    </div>
  );
}
```

## Context for this task

This is Task 4, building on Task 2's `CategoryBadge` and reusing `Avatar` (Phase 2). Per the Phase 4 design spec's decision, this card shows nail/upvote/comment counts as static numbers with NO click handlers for nailing or upvoting — those come in Phase 6. The Share button IS fully functional (clipboard copy + toast) since it needs no backend.

**Why `isBlobUrl`/`unoptimized`:** this component is deliberately decoupled from the DB row shape so it can render both real feed posts (whose `imageUrl` is always a real `https://` Supabase Storage URL) AND the live preview in the create-post form (Task 6), whose `imageUrl` will be a browser-generated `blob:` object URL from `URL.createObjectURL()` before the image is ever uploaded. `next/image`'s built-in optimizer can only fetch `http(s)` URLs (local or allowlisted remote) — it cannot process a `blob:` URL, which only exists in the browser's memory for the current page session. Setting `unoptimized` for blob URLs makes `next/image` render as a plain `<img>` passthrough instead of attempting server-side optimization, which works correctly for blob URLs. Real feed posts (Task 7) never hit this branch since their URLs never start with `blob:`.

`bg-wood-dark` on the image container is a fallback background color shown briefly while the image loads (or if it fails to load), consistent with the design system's wood-tone palette.

## Before You Begin

If you have questions, ask them now.

## Your Job

1. Create `components/PostCard.tsx` exactly as specified
2. Verify `npm run build` succeeds
3. Commit
4. Self-review
5. Report back

Work from: `C:\Users\jreeh\Desktop\Tool Box`

## When You're in Over Your Head

Escalate with BLOCKED or NEEDS_CONTEXT if `Avatar` or `CategoryBadge`'s actual prop signatures don't match what's used here.

## Before Reporting Back: Self-Review

- Does the file match the spec exactly?
- Does `npm run build` succeed?
- Is the commit scoped to only this one file?

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds (not rendered by any page yet — Tasks 6 and 7 use it).

- [ ] **Step 3: Commit**

```bash
git add components/PostCard.tsx
git commit -m "Add PostCard component with static counts and working share button"
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

## Task 5: Create-post Server Action

**Files:**
- Create: `app/post/new/actions.ts`

- [ ] **Step 1: Create app/post/new/actions.ts**

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PostCategory } from "@/lib/types";

export type CreatePostState = {
  error?: string;
};

const VALID_CATEGORIES: PostCategory[] = [
  "projects",
  "tips-techniques",
  "tool-talk",
  "plans-blueprints",
];

export async function createPostAction(
  _prevState: CreatePostState,
  formData: FormData
): Promise<CreatePostState> {
  const title = (formData.get("title") as string)?.trim();
  const description = ((formData.get("description") as string) || "").trim() || null;
  const category = formData.get("category") as string;
  const subcategory = ((formData.get("subcategory") as string) || "").trim() || null;
  const image = formData.get("image") as File | null;

  if (!title) {
    return { error: "Title is required" };
  }
  if (!category || !VALID_CATEGORIES.includes(category as PostCategory)) {
    return { error: "Please select a valid category" };
  }
  if (!image || image.size === 0) {
    return { error: "An image is required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?reason=auth");
  }

  const filePath = `${user.id}/${Date.now()}-${image.name}`;

  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(filePath, image);

  if (uploadError) {
    return { error: "Failed to upload image. Please try again." };
  }

  const { data: publicUrlData } = supabase.storage
    .from("post-images")
    .getPublicUrl(filePath);

  const { data: newPost, error: insertError } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      title,
      description,
      category,
      subcategory,
      image_url: publicUrlData.publicUrl,
    })
    .select("id")
    .single();

  if (insertError || !newPost) {
    return { error: "Failed to create post. Please try again." };
  }

  redirect(`/post/${newPost.id}`);
}
```

## Context for this task

This is Task 5. `app/post/` and `app/post/new/` already exist (Phase 1 placeholder, Phase 2 added `requireAuth()` to the page). This creates the Server Action the create-post form (Task 6) will submit to. Follows the exact `useFormState`-compatible signature pattern established in Phase 2's auth actions (`signInAction`, `signUpAction`, `completeOnboardingAction`): `(prevState, formData) => Promise<State>`.

Server-side validation (title required, category must be one of the 4 valid values, image required and non-empty) happens here regardless of client-side validation in Task 6's form — client-side checks are for fast UX feedback only and are not trusted alone, consistent with the pattern already established for password length validation in Phase 2.

`supabase.storage.from("post-images").upload(filePath, image)` relies on the `post_images_authenticated_upload` Storage policy from Phase 1's migration (any authenticated user can upload) — no new Storage policy needed. `getPublicUrl` is synchronous (not awaited) — it just constructs a URL string, it doesn't make a network call, matching the Supabase JS client's actual API shape.

Per the design spec's accepted trade-off: if `upload` succeeds but the subsequent `insert` fails, the uploaded Storage object is not cleaned up. This is intentionally out of scope for this phase.

## Before You Begin

If you have questions, ask them now.

## Your Job

1. Create `app/post/new/actions.ts` exactly as specified
2. Verify `npm run build` succeeds
3. Commit
4. Self-review
5. Report back

Work from: `C:\Users\jreeh\Desktop\Tool Box`

## When You're in Over Your Head

Escalate with BLOCKED or NEEDS_CONTEXT if the Supabase Storage client API differs from what's assumed here (e.g., `getPublicUrl`'s return shape), or if TypeScript complains about the `File` type in a Server Action context in a way that isn't obviously fixable.

## Before Reporting Back: Self-Review

- Does the file match the spec exactly?
- Does `npm run build` succeed?
- Is the commit scoped to only this one file?

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds (not called by any UI yet — Task 6 wires up the form that submits to it).

- [ ] **Step 3: Commit**

```bash
git add app/post/new/actions.ts
git commit -m "Add createPostAction: image upload plus post insert with validation"
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

## Task 6: Create-post form with live preview, and page wiring

**Files:**
- Create: `app/post/new/post-form.tsx`
- Modify: `app/post/new/page.tsx`

- [ ] **Step 1: Create app/post/new/post-form.tsx**

```tsx
"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { PostCard } from "@/components/PostCard";
import { createPostAction, type CreatePostState } from "./actions";
import { CATEGORIES } from "@/lib/categories";

const initialState: CreatePostState = {};

interface PostFormProps {
  author: {
    username: string;
    avatarUrl: string | null;
  };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-toolbox-red text-off-white text-sm px-4 py-2 rounded disabled:opacity-60"
    >
      {pending ? "Posting..." : "Post It"}
    </button>
  );
}

export function PostForm({ author }: PostFormProps) {
  const [state, formAction] = useFormState(createPostAction, initialState);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setFileError("Please choose an image file");
      e.target.value = "";
      setPreviewUrl(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError("Image must be under 5MB");
      e.target.value = "";
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 p-8">
      <form action={formAction} className="flex flex-col gap-4">
        <input
          type="text"
          name="title"
          placeholder="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          rows={4}
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        />
        <select
          name="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        >
          <option value="" disabled>
            Select a category
          </option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="subcategory"
          placeholder="Subcategory (optional)"
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        />
        <input
          type="file"
          name="image"
          accept="image/*"
          required
          onChange={handleFileChange}
          className="text-off-white text-sm"
        />
        {fileError && <p className="text-toolbox-red text-sm">{fileError}</p>}
        {state.error && <p className="text-toolbox-red text-sm">{state.error}</p>}
        <SubmitButton />
      </form>

      <div>
        <p className="font-body text-off-white text-sm mb-2">Preview</p>
        {previewUrl ? (
          <PostCard
            post={{
              id: "preview",
              title: title || "Your title here",
              imageUrl: previewUrl,
              category: category || "projects",
              nailCount: 0,
              upvoteCount: 0,
              commentCount: 0,
            }}
            author={author}
          />
        ) : (
          <div className="border-2 border-chrome rounded aspect-[4/3] flex items-center justify-center text-dark-chrome text-sm">
            Upload an image to see a preview
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace app/post/new/page.tsx**

```tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "./post-form";

export default async function NewPostPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-heading text-4xl text-toolbox-red p-8 pb-0">New Post</h1>
      <PostForm
        author={{
          username: profile?.username ?? "you",
          avatarUrl: profile?.avatar_url ?? null,
        }}
      />
    </div>
  );
}
```

## Context for this task

This is Task 6, building on Task 4 (`PostCard`) and Task 5 (`createPostAction`). `app/post/new/page.tsx` already calls `requireAuth()` (Phase 2, Task 9) — this task adds a profile fetch alongside it and replaces the placeholder body with the real form. `requireAuth()` returns the Supabase `user` object (Phase 2's `lib/auth/require-auth.ts`), which is used here to fetch the user's own `profiles` row for the preview's author display.

The preview only renders a `PostCard` once an image has been selected (`previewUrl` is set) — before that, a placeholder box is shown. This avoids passing an empty string as `PostCard`'s `imageUrl`, which `next/image` would reject. The preview's `id: "preview"` is a harmless placeholder value since the preview `PostCard`'s internal links (to `/post/preview`, `/u/${username}`) are never actually clicked in practice (it's inside a form, not meant to be a real navigation target) — this matches the spec's intent of a live-updating visual preview, not a functional card.

Client-side file validation (image MIME type check, 5MB limit) happens in `handleFileChange`; the Server Action (Task 5) independently validates required fields server-side regardless, per the "don't trust client validation alone" pattern.

## Before You Begin

If you have questions, ask them now.

## Your Job

1. Create `app/post/new/post-form.tsx` and update `app/post/new/page.tsx` exactly as specified
2. Verify `npm run build` succeeds
3. Commit
4. Self-review
5. Report back

Work from: `C:\Users\jreeh\Desktop\Tool Box`

## When You're in Over Your Head

Escalate with BLOCKED or NEEDS_CONTEXT if `requireAuth()`'s actual return shape doesn't match `user.id` usage here, or if the existing `page.tsx` has diverged from the Phase 2 version in a way that makes a clean edit risky.

## Before Reporting Back: Self-Review

- Do both files match the specified content exactly?
- Does `npm run build` succeed?
- Is the diff scoped to only these two files?

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/post/new/post-form.tsx app/post/new/page.tsx
git commit -m "Wire up create-post form with live preview panel"
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

## Task 7: Feed page — filters, sort, first page

**Files:**
- Create: `app/feed/types.ts`
- Modify: `app/feed/page.tsx` (replacing the Phase 1 placeholder)

- [ ] **Step 1: Create app/feed/types.ts**

```ts
import type { Post } from "@/lib/types";

export interface FeedPost extends Post {
  profiles: { username: string; avatar_url: string | null } | null;
}
```

- [ ] **Step 2: Replace app/feed/page.tsx**

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/categories";
import { FeedList } from "./feed-list";
import type { FeedPost } from "./types";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "nailed", label: "Most Nailed" },
  { value: "top", label: "Top Rated" },
];

function sortToColumn(sort: string): { column: string; ascending: boolean } {
  if (sort === "nailed") return { column: "nail_count", ascending: false };
  if (sort === "top") return { column: "upvote_count", ascending: false };
  return { column: "created_at", ascending: false };
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { category, sort = "newest" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*, profiles(username, avatar_url)")
    .range(0, PAGE_SIZE - 1);

  if (category) {
    query = query.eq("category", category);
  }

  const { column, ascending } = sortToColumn(sort);
  query = query.order(column, { ascending });

  const { data: posts, error } = await query;

  if (error) {
    console.error("Failed to fetch feed posts:", error);
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/feed"
            className={`text-sm px-3 py-1 rounded border text-off-white ${
              !category ? "bg-toolbox-red border-toolbox-red" : "border-chrome"
            }`}
          >
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/feed?category=${c.slug}${sort !== "newest" ? `&sort=${sort}` : ""}`}
              className={`text-sm px-3 py-1 rounded border text-off-white ${
                category === c.slug ? "bg-toolbox-red border-toolbox-red" : "border-chrome"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-2">
          {SORT_OPTIONS.map((s) => (
            <Link
              key={s.value}
              href={`/feed?sort=${s.value}${category ? `&category=${category}` : ""}`}
              className={`text-sm px-3 py-1 rounded border text-off-white ${
                sort === s.value ? "bg-toolbox-red border-toolbox-red" : "border-chrome"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <FeedList
        initialPosts={(posts as FeedPost[]) ?? []}
        category={category ?? null}
        sort={sort}
      />
    </div>
  );
}
```

## Context for this task

This is Task 7, independent of Tasks 1-6 except for reusing `CATEGORIES` from Task 1. `app/feed/page.tsx` currently has the Phase 1 placeholder — this replaces it entirely. `FeedPost` extends the base `Post` type (Phase 1) with the joined `profiles` relation, since the query selects `*, profiles(username, avatar_url)` — Supabase's PostgREST resolves this join automatically via the `posts.user_id → profiles.id` foreign key from Phase 1's migration, no explicit join syntax needed beyond naming the related table.

This task creates `app/feed/types.ts` and references `./feed-list` (the `FeedList` component), which does NOT exist yet — it's built in Task 8. This means Task 7 alone will NOT produce a successful `npm run build` (the import will fail to resolve). This is intentional: Tasks 7 and 8 are two halves of one cohesive feed feature that's impractical to split with each individually buildable, since the server page and the client list component reference each other's types. Task 7's own verification step reflects this — the build ISN'T expected to succeed until Task 8 is also complete. Do not "fix" this by stubbing out `FeedList` early; just proceed directly to Task 8 after this one.

The filter/sort links preserve the other axis's value when navigating (e.g., clicking a category link keeps the current `sort` param, and vice versa) so switching one filter doesn't reset the other.

- [ ] **Step 3: Commit (before build verification, since Task 8 completes the pair)**

```bash
git add app/feed/types.ts app/feed/page.tsx
git commit -m "Add feed page: category/sort filters via URL params, first-page query"
```

## Before You Begin

If you have questions, ask them now.

## Your Job

1. Create `app/feed/types.ts` and replace `app/feed/page.tsx` exactly as specified
2. Commit (build verification is deferred to Task 8 — see context above)
3. Self-review
4. Report back

Work from: `C:\Users\jreeh\Desktop\Tool Box`

## When You're in Over Your Head

Escalate with BLOCKED or NEEDS_CONTEXT if something about the Supabase join syntax or `searchParams` typing seems wrong beyond the expected missing-`FeedList`-import build failure.

## Before Reporting Back: Self-Review

- Do both files match the specified content exactly?
- Is the only expected build error the missing `./feed-list` module (confirm by reading the error, not just assuming)?
- Is the commit scoped to only these two files?

## Report Format

- **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- What you implemented
- What you tested (note: full build success is NOT expected yet, per context above — confirm the only error is the missing FeedList import)
- Files changed
- Self-review findings
- Any issues or concerns
- The git commit SHA

---

## Task 8: Feed infinite scroll list

**Files:**
- Create: `app/feed/feed-list.tsx`

- [ ] **Step 1: Create app/feed/feed-list.tsx**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MasonryGrid } from "@/components/MasonryGrid";
import { PostCard } from "@/components/PostCard";
import type { FeedPost } from "./types";

const PAGE_SIZE = 20;

interface FeedListProps {
  initialPosts: FeedPost[];
  category: string | null;
  sort: string;
}

function sortToColumn(sort: string): { column: string; ascending: boolean } {
  if (sort === "nailed") return { column: "nail_count", ascending: false };
  if (sort === "top") return { column: "upvote_count", ascending: false };
  return { column: "created_at", ascending: false };
}

export function FeedList({ initialPosts, category, sort }: FeedListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosts(initialPosts);
    setHasMore(initialPosts.length === PAGE_SIZE);
  }, [initialPosts]);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, posts.length]);

  async function loadMore() {
    setLoading(true);
    const supabase = createClient();
    const { column, ascending } = sortToColumn(sort);

    let query = supabase
      .from("posts")
      .select("*, profiles(username, avatar_url)")
      .range(posts.length, posts.length + PAGE_SIZE - 1)
      .order(column, { ascending });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to load more posts:", error);
      setLoading(false);
      return;
    }

    const newPosts = (data as FeedPost[]) ?? [];
    setPosts((prev) => [...prev, ...newPosts]);
    setHasMore(newPosts.length === PAGE_SIZE);
    setLoading(false);
  }

  return (
    <>
      <MasonryGrid>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={{
              id: post.id,
              title: post.title,
              imageUrl: post.image_url,
              category: post.category,
              nailCount: post.nail_count,
              upvoteCount: post.upvote_count,
              commentCount: 0,
            }}
            author={{
              username: post.profiles?.username ?? "unknown",
              avatarUrl: post.profiles?.avatar_url ?? null,
            }}
          />
        ))}
      </MasonryGrid>
      {hasMore && <div ref={sentinelRef} className="h-4" />}
    </>
  );
}
```

## Context for this task

This is Task 8, completing the pair started in Task 7. `app/feed/page.tsx` and `app/feed/types.ts` already exist from Task 7 and import `FeedList` from this file — Task 7's build was expected to fail on that missing import; this task resolves it.

`commentCount: 0` is hardcoded here (and in Task 6's preview) because `posts` has no denormalized comment-count column (unlike `nail_count`/`upvote_count`, which Phase 1's migration keeps in sync via triggers) — comments themselves don't exist until Phase 5. This mirrors exactly how nail/upvote counts are real DB columns that simply read `0` for every post today, since nothing increments them until Phase 6. Not a gap specific to this task — a natural, temporary consequence of building phases in order.

`sortToColumn` is duplicated between `app/feed/page.tsx` (Task 7) and this file rather than extracted to a shared helper — this is a deliberate, small duplication: the two call sites (server-side first page, client-side subsequent pages) use it in different contexts (server component vs. client component), and the function is 3 lines. Extracting a shared `lib/feed-sort.ts` for this would be reasonable future cleanup but isn't required for correctness now; don't add it unless asked.

The `IntersectionObserver` effect's dependency array intentionally omits `loadMore` (would need `useCallback` to stabilize it, adding complexity for a 3-line effect) — the `eslint-disable` comment documents this choice explicitly rather than silently suppressing the lint warning.

## Before You Begin

If you have questions, ask them now.

## Your Job

1. Create `app/feed/feed-list.tsx` exactly as specified
2. Verify `npm run build` succeeds NOW (this resolves Task 7's expected missing-import failure)
3. Commit
4. Self-review
5. Report back

Work from: `C:\Users\jreeh\Desktop\Tool Box`

## When You're in Over Your Head

Escalate with BLOCKED or NEEDS_CONTEXT if `lib/supabase/client.ts`'s exported `createClient()` signature doesn't match usage here, or if the build still fails after this file is added for a reason unrelated to the now-resolved missing import.

## Before Reporting Back: Self-Review

- Does the file match the spec exactly?
- Does `npm run build` succeed (confirming both Task 7 and Task 8 together are correct)?
- Is the commit scoped to only this one file?

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds — this confirms Task 7's page and this task's list component correctly resolve against each other.

- [ ] **Step 3: Commit**

```bash
git add app/feed/feed-list.tsx
git commit -m "Add feed infinite scroll via IntersectionObserver"
```

## Report Format

- **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- What you implemented
- What you tested and test results (confirm build succeeds now, resolving Task 7's expected gap)
- Files changed
- Self-review findings
- Any issues or concerns
- The git commit SHA

---

## Task 9: Final verification pass

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
git log --oneline -9
```

Expected: one commit per task, in order.

- [ ] **Step 4: Document manual verification steps for the user**

Since there's no live Supabase project connected in this development environment, note the following for the user to verify manually once they run `npm run dev` with real credentials:

1. Visit `/post/new` while logged in → fill out the form, select an image → preview panel updates live as you type and after selecting the image
2. Submit → redirected to `/post/[id]` (still a Phase 5 placeholder — confirms the row was created and the image uploaded to Storage)
3. Visit `/feed` → the new post appears in the masonry grid with the correct category badge, counts at 0, correct author avatar/username
4. Click a category tab → URL updates, results filter correctly; click a sort option → URL updates, order changes; combining both preserves each other's param
5. Try uploading a non-image file or one over 5MB → client-side error shown, no upload attempted
6. With 20+ posts created, scroll to the bottom of the feed → next page loads automatically

- [ ] **Step 5: Final commit (if anything changed during verification)**

```bash
git add -A
git commit -m "Phase 4 post creation and feed complete: verify clean build and no tracked secrets"
```

(Skip if nothing to commit.)

---

## Plan self-review notes

- **Spec coverage:** every Phase 4 spec section (create-post form + upload + live preview, feed masonry grid, category/sort filters via URL, infinite scroll, PostCard with static counts) maps to Tasks 1–8; Task 9 covers the spec's "Testing / verification" section, with live-Supabase-dependent checks explicitly called out as manual follow-up.
- **Deferred items** (NAIL IT/upvote interactivity, rich text, masonry library, post editing/deletion, orphaned-Storage-object cleanup) are explicitly out of scope per the spec's non-goals and are not stubbed beyond what's needed (static counts render correctly at 0).
- **Type consistency:** `FeedPost` (Task 7) extends `Post` (Phase 1) with the joined `profiles` shape, used identically in both `app/feed/page.tsx` (Task 7) and `app/feed/feed-list.tsx` (Task 8). `PostCard`'s prop shape (`post: { id, title, imageUrl, category, nailCount, upvoteCount, commentCount }`, `author: { username, avatarUrl }`) is used identically across Task 6 (create-post preview, using local form state) and Task 8 (feed, mapping from `FeedPost` rows) — no drift between the two call sites' field names or casing.
- **Cross-task dependency called out explicitly:** Tasks 7 and 8 are a deliberately split pair where Task 7 alone doesn't build successfully — this is documented in both tasks' context sections so whoever executes them (or reviews them) doesn't mistake the expected intermediate failure for a defect.
