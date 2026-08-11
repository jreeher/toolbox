# The Toolbox — Phase 2: Auth & Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Working email/password signup, login, logout, and onboarding (username + bio → `profiles` row) via Supabase Auth and Server Actions, with session-aware navigation and a reusable auth-protection pattern for later phases.

**Architecture:** Server Actions call the existing `lib/supabase/server.ts` client for all auth mutations (signup, login, logout, onboarding insert). `ToolboxNav` becomes an async server component that reads the session and renders logged-in/out states. A shared `requireAuth()` helper redirects unauthenticated users to `/login?reason=auth`; a client-side toast reads that query param to explain the redirect. `sonner` provides toasts.

**Tech Stack:** Next.js 14 (App Router, Server Actions, Route Handlers), `@supabase/ssr` (from Phase 1), `sonner`, `react-dom`'s `useFormState`/`useFormStatus`.

---

## Task 1: Add sonner and mount the Toaster

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `app/layout.tsx`

- [ ] **Step 1: Install sonner**

```bash
npm install sonner
```

- [ ] **Step 2: Mount the Toaster in the root layout**

Modify `app/layout.tsx`: add the import and render `<Toaster />` inside `<body>`, after `<main>`, themed to the design system.

```tsx
import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { Toaster } from "sonner";
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
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "var(--charcoal)",
              color: "var(--off-white)",
              border: "1px solid var(--chrome)",
            },
          }}
        />
      </body>
    </html>
  );
}
```

Note: `ToolboxNav` is imported the same as before — it becomes an async server component in Task 10, which requires no change to this import or usage.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: succeeds (ToolboxNav is still the Phase 1 placeholder at this point — Task 10 changes it).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json app/layout.tsx
git commit -m "Add sonner and mount themed Toaster in root layout"
```

---

## Task 2: Shared requireAuth() helper

**Files:**
- Create: `lib/auth/require-auth.ts`

- [ ] **Step 1: Create lib/auth/require-auth.ts**

```ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?reason=auth");
  }

  return user;
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add lib/auth/require-auth.ts
git commit -m "Add requireAuth() helper for page-level auth protection"
```

---

## Task 3: Sign-out Server Action

**Files:**
- Create: `lib/auth/actions.ts`

- [ ] **Step 1: Create lib/auth/actions.ts**

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add lib/auth/actions.ts
git commit -m "Add sign-out Server Action"
```

---

## Task 4: Avatar component

**Files:**
- Create: `components/Avatar.tsx`

- [ ] **Step 1: Create components/Avatar.tsx**

```tsx
import Image from "next/image";

interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}

export function Avatar({ username, avatarUrl, size = 36 }: AvatarProps) {
  const initials = username.slice(0, 2).toUpperCase();

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={username}
        width={size}
        height={size}
        className="rounded object-cover"
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded bg-wood text-off-white font-body text-xs font-semibold"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds (component isn't used yet until Task 10 — an unused-export build is still valid TypeScript/Next.js).

- [ ] **Step 3: Commit**

```bash
git add components/Avatar.tsx
git commit -m "Add Avatar component with initials fallback"
```

---

## Task 5: Login page and Server Action

**Files:**
- Create: `app/(auth)/login/actions.ts`
- Modify: `app/(auth)/login/page.tsx` (replacing the Phase 1 placeholder)

- [ ] **Step 1: Create app/(auth)/login/actions.ts**

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignInState = {
  error?: string;
};

export async function signInAction(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/feed");
}
```

- [ ] **Step 2: Replace app/(auth)/login/page.tsx**

```tsx
"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { signInAction, type SignInState } from "./actions";

const initialState: SignInState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-toolbox-red text-off-white text-sm px-4 py-2 rounded disabled:opacity-60"
    >
      {pending ? "Signing in..." : "Sign In"}
    </button>
  );
}

function LoginForm() {
  const [state, formAction] = useFormState(signInAction, initialState);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("reason") === "auth") {
      toast("Sign in to continue");
    }
  }, [searchParams]);

  return (
    <div className="max-w-sm mx-auto p-8">
      <h1 className="font-heading text-4xl text-toolbox-red mb-6">Sign In</h1>
      <form action={formAction} className="flex flex-col gap-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        />
        {state.error && <p className="text-toolbox-red text-sm">{state.error}</p>}
        <SubmitButton />
      </form>
      <p className="text-off-white text-sm mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-toolbox-red underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: succeeds, no warnings about `useSearchParams` needing a Suspense boundary (the `<Suspense>` wrapper in `LoginPage` satisfies this).

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)/login/actions.ts" "app/(auth)/login/page.tsx"
git commit -m "Implement login page with Server Action and auth-redirect toast"
```

---

## Task 6: Signup page and Server Action

**Files:**
- Create: `app/(auth)/signup/actions.ts`
- Modify: `app/(auth)/signup/page.tsx` (replacing the Phase 1 placeholder)

- [ ] **Step 1: Create app/(auth)/signup/actions.ts**

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignUpState = {
  error?: string;
  checkEmail?: boolean;
};

export async function signUpAction(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "Passwords don't match" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/onboarding");
  }

  return { checkEmail: true };
}
```

- [ ] **Step 2: Replace app/(auth)/signup/page.tsx**

```tsx
"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signUpAction, type SignUpState } from "./actions";

const initialState: SignUpState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-toolbox-red text-off-white text-sm px-4 py-2 rounded disabled:opacity-60"
    >
      {pending ? "Signing up..." : "Sign Up"}
    </button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signUpAction, initialState);

  if (state.checkEmail) {
    return (
      <div className="max-w-sm mx-auto p-8">
        <h1 className="font-heading text-4xl text-toolbox-red mb-4">Check Your Email</h1>
        <p className="text-off-white text-sm">
          We sent a confirmation link to your email. Click it to activate your account,
          then come back and sign in.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-8">
      <h1 className="font-heading text-4xl text-toolbox-red mb-6">Sign Up</h1>
      <form action={formAction} className="flex flex-col gap-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          minLength={6}
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          required
          minLength={6}
          className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
        />
        {state.error && <p className="text-toolbox-red text-sm">{state.error}</p>}
        <SubmitButton />
      </form>
      <p className="text-off-white text-sm mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-toolbox-red underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)/signup/actions.ts" "app/(auth)/signup/page.tsx"
git commit -m "Implement signup page with Server Action and check-email state"
```

---

## Task 7: Auth callback Route Handler

**Files:**
- Create: `app/auth/callback/route.ts`

- [ ] **Step 1: Create app/auth/callback/route.ts**

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/onboarding`);
}
```

## Context for this task

This is a Route Handler (`route.ts`, not `page.tsx`) at `app/auth/callback/`, which is a plain nested route (NOT inside the `(auth)` route group — it must be reachable at the literal path `/auth/callback` because that's the redirect URL configured in Supabase's email templates). It exchanges the confirmation-link `code` for a session, then redirects to `/onboarding`, which itself will redirect to `/feed` if the user already completed onboarding (see Task 8).

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds, `/auth/callback` appears as a route.

- [ ] **Step 3: Commit**

```bash
git add app/auth/callback/route.ts
git commit -m "Add Supabase email-confirmation callback route handler"
```

---

## Task 8: Onboarding page, form, and Server Action

**Files:**
- Create: `app/onboarding/actions.ts`
- Create: `app/onboarding/onboarding-form.tsx`
- Modify: `app/onboarding/page.tsx` (replacing the Phase 1 placeholder)

- [ ] **Step 1: Create app/onboarding/actions.ts**

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = {
  error?: string;
};

export async function completeOnboardingAction(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const username = (formData.get("username") as string)?.trim();
  const bio = ((formData.get("bio") as string) || "").trim() || null;

  if (!username) {
    return { error: "Username is required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?reason=auth");
  }

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    username,
    bio,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is taken — try another" };
    }
    return { error: error.message };
  }

  redirect("/feed");
}
```

- [ ] **Step 2: Create app/onboarding/onboarding-form.tsx**

```tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { completeOnboardingAction, type OnboardingState } from "./actions";

const initialState: OnboardingState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-toolbox-red text-off-white text-sm px-4 py-2 rounded disabled:opacity-60"
    >
      {pending ? "Saving..." : "Continue"}
    </button>
  );
}

export function OnboardingForm() {
  const [state, formAction] = useFormState(completeOnboardingAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input
        type="text"
        name="username"
        placeholder="Username"
        required
        minLength={3}
        className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
      />
      <textarea
        name="bio"
        placeholder="Bio (optional)"
        rows={3}
        className="bg-charcoal border border-chrome text-off-white px-3 py-2 rounded"
      />
      {state.error && <p className="text-toolbox-red text-sm">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
```

- [ ] **Step 3: Replace app/onboarding/page.tsx**

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?reason=auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    redirect("/feed");
  }

  return (
    <div className="max-w-sm mx-auto p-8">
      <h1 className="font-heading text-4xl text-toolbox-red mb-6">
        Set Up Your Profile
      </h1>
      <OnboardingForm />
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/onboarding/
git commit -m "Implement onboarding flow: username/bio form, profile insert, existing-profile redirect"
```

---

## Task 9: Protect /post/new with requireAuth()

**Files:**
- Modify: `app/post/new/page.tsx`

- [ ] **Step 1: Update app/post/new/page.tsx**

```tsx
import { requireAuth } from "@/lib/auth/require-auth";

export default async function NewPostPage() {
  await requireAuth();
  return <div className="p-8 font-heading text-3xl">New Post — coming in Phase 4</div>;
}
```

## Context for this task

Post creation itself isn't built until Phase 4 — this task only proves the `requireAuth()` protection pattern works end-to-end on a real route (redirect to `/login?reason=auth` when logged out, render normally when logged in). The placeholder text is intentionally unchanged from Phase 1 otherwise.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds. Note: this page was previously a static (`○`) route; it will now be dynamic (`ƒ`) since it depends on the request's session — that's expected and correct.

- [ ] **Step 3: Commit**

```bash
git add app/post/new/page.tsx
git commit -m "Protect /post/new with requireAuth()"
```

---

## Task 10: Session-aware ToolboxNav

**Files:**
- Modify: `components/ToolboxNav.tsx`

- [ ] **Step 1: Replace components/ToolboxNav.tsx**

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { signOutAction } from "@/lib/auth/actions";

export async function ToolboxNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { username: string; avatar_url: string | null } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

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
      <div className="flex items-center gap-3">
        {user && profile ? (
          <>
            <Link
              href="/post/new"
              className="bg-toolbox-red text-off-white text-sm px-4 py-2 rounded"
            >
              New Post
            </Link>
            <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={32} />
            <span className="text-off-white text-sm hidden sm:inline">
              {profile.username}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="border border-chrome text-off-white text-sm px-4 py-2 rounded"
              >
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="border border-chrome text-off-white text-sm px-4 py-2 rounded"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-toolbox-red text-off-white text-sm px-4 py-2 rounded"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
```

## Context for this task

This intentionally keeps the center nav (`Feed` / `Categories` / `Boards`) as static, non-interactive text, exactly as it was in Phase 1 — those become real links/filters in Phase 4 (Feed) and Phase 6 (Boards). Only the right-hand auth section changes. The component changes from a plain function to an `async` function because it now queries Supabase; its usage in `app/layout.tsx` (`<ToolboxNav />`) doesn't need to change since React/Next.js supports async Server Components as JSX directly.

If `user` exists but `profile` is `null` (e.g., a user who signed up but hasn't completed onboarding yet, mid-flow), the nav falls back to the logged-out state rather than crashing — this is correct: such a user shouldn't see "New Post" until they've picked a username, and they'll be routed to `/onboarding` if they try to visit a protected page.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/ToolboxNav.tsx
git commit -m "Make ToolboxNav session-aware: logged-in/out states, avatar, sign-out"
```

---

## Task 11: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Clean build**

```bash
npm run build
```

Expected: succeeds with zero type errors. `/post/new` and any page reading cookies/session should now show as dynamic (`ƒ`) rather than static (`○`) — this is expected.

- [ ] **Step 2: Confirm no secrets are tracked**

```bash
git status
git ls-files | grep -i env
```

Expected: only `.env.example` tracked, `.env.local` absent.

- [ ] **Step 3: Confirm git history**

```bash
git log --oneline -12
```

Expected: one commit per task above, in order.

- [ ] **Step 4: Document manual verification steps for the user**

Since there's no live Supabase project connected in this development environment, the following flow cannot be automated here and should be noted in the task report for the user to verify manually once their real `.env.local` values are in place:

1. Sign up with a new email/password → lands on `/onboarding` (or sees "Check Your Email" if the Supabase project has email confirmation enabled)
2. Complete onboarding with a username → lands on `/feed`, a `profiles` row exists with the correct `id`/`username`
3. Nav shows avatar + username + New Post + Sign Out
4. Sign out → nav reverts to Sign In/Sign Up, redirected to `/`
5. Log back in with the same credentials → lands on `/feed`
6. Visit `/post/new` or `/onboarding` while logged out → redirected to `/login?reason=auth`, toast appears
7. Try to onboard with a username that's already taken by another account → friendly inline error, no crash

- [ ] **Step 5: Final commit (if anything changed during verification)**

```bash
git add -A
git commit -m "Phase 2 auth & profiles complete: verify clean build and no tracked secrets"
```

(Skip if nothing to commit.)

---

## Plan self-review notes

- **Spec coverage:** every Phase 2 spec section (signup, login, callback, onboarding, sign-out, session-aware nav, requireAuth helper, toasts) maps to Tasks 1–10; Task 11 covers the spec's "Testing / verification" section, with the live-Supabase-dependent steps explicitly called out as manual follow-up since no live project is connected in this environment.
- **Deferred items** (AuthModal, avatar upload, password reset, OAuth) are explicitly out of scope per the spec's non-goals and are not stubbed.
- **Type consistency:** `SignInState`, `SignUpState`, and `OnboardingState` each follow the same `{ error?: string }`-shaped pattern consumed by `useFormState`/`useFormStatus`, consistent across Tasks 5, 6, and 8. `requireAuth()` (Task 2) and the inline session checks in `app/onboarding/page.tsx` (Task 8) and `components/ToolboxNav.tsx` (Task 10) all use the same `supabase.auth.getUser()` call from the same `lib/supabase/server.ts` client established in Phase 1 — no duplicate or divergent auth-check logic.
- **Route note carried from spec:** `/auth/callback` (Task 7) is deliberately outside the `(auth)` route group, since Supabase's email templates need the literal `/auth/callback` path.
