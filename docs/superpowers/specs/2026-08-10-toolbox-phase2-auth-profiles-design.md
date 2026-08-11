# The Toolbox — Phase 2: Auth & Profiles

## Context

Phase 1 (Foundation) is complete and merged to `master`: Next.js 14 scaffold, design system, Supabase SSR wiring (browser client, server client, session-refresh middleware), the full database migration (including the `profiles` table with RLS), placeholder routes for every page, and a static `ToolboxNav`.

This spec covers Phase 2 of the phased build-out:

1. Foundation (done)
2. **Auth & Profiles** (this spec)
3. Homepage & Toolbox Animation
4. Post Creation & Feed
5. Post Detail & Comments
6. Nailing & Boards
7. Social & Search
8. Polish

Phase 2 implements real signup/login/logout, the onboarding flow that creates a `profiles` row, session-aware navigation, and the reusable pattern later phases will use to protect actions behind auth.

## Goals

- Working email/password signup and login via Supabase Auth, using Server Actions and the existing `@supabase/ssr` server client
- An `/onboarding` flow that collects username (required, unique) + optional bio and inserts into `profiles`
- A `/auth/callback` route to support Supabase's email-confirmation link flow (works whether or not email confirmation is enabled on the Supabase project)
- Sign-out
- `ToolboxNav` becomes session-aware: shows Sign In/Sign Up when logged out, avatar + "New Post" + sign-out when logged in
- Page-level protection for `/post/new` and `/onboarding`, redirecting to `/login` with an explanatory toast if unauthenticated
- Toasts (via `sonner`) styled to the app's design system, for auth feedback (redirect explanation, "check your email," sign-out confirmation)
- A reusable `requireAuth()` helper other phases will call for action-level protection (nail/upvote/comment/follow) — those actions themselves don't exist yet, so only the helper is built now

## Non-goals (deferred)

- `AuthModal` component (quick-action sign-in prompt) — deferred until a real caller exists in a later phase (nail/upvote/comment/follow), per YAGNI
- Avatar upload during onboarding — the spec's onboarding flow is username + bio only; avatar upload is part of profile editing in a later phase
- Password reset / forgot-password flow — not in the original spec, out of scope unless requested later
- OAuth/social login — email/password only, per the original spec
- Any UI for `/feed`, `/post/[id]`, etc. beyond what's needed to redirect into them post-login — those pages remain Phase 1 placeholders until their own phases

## Decisions

- **Form architecture:** Server Actions calling the existing `lib/supabase/server.ts` client, not client-side `supabase-js` calls. Fits Next.js 14 App Router idioms and reuses Phase 1's session/cookie handling with no new patterns.
- **Toast library:** `sonner` — lightweight, minimal setup, easy to theme to the dark/industrial palette.
- **Email confirmation:** the flow is built to work correctly whether or not the Supabase project has "Confirm email" enabled. After `supabase.auth.signUp()`, if a session comes back immediately, redirect straight to `/onboarding`; if no session comes back (confirmation pending), show an inline "check your email" message instead of redirecting.
- **Protection strategy:** page-level protection (redirect-if-no-session) for `/onboarding` and `/post/new` only, since those are the only two pages Phase 2 actually has a reason to protect. Action-level protection (nail/upvote/comment/follow) is deferred to whichever phase builds those actions, but the shared `requireAuth()` helper is built now so later phases have a consistent pattern to call.
- **Route note:** the original top-level spec text says `/auth/signup` and `/auth/login`, but the project's actual route structure (established in Phase 1 via the `app/(auth)/` route group) resolves those to `/signup` and `/login` — this spec uses the real routes (`/signup`, `/login`) consistently. `/auth/callback` is a new, non-route-grouped path required for Supabase's email-confirmation link and isn't part of the original page list — it's plumbing, not a user-facing page.

## Architecture

### Dependencies
- Add `sonner` (new dependency)

### Database
No schema changes. `profiles` table and its RLS policies (`profiles_select_all`, `profiles_insert_own`, `profiles_update_own`) already exist from Phase 1 and are sufficient: a user can only insert/update their own profile row (`auth.uid() = id`), and all profiles are publicly readable.

### Auth flow

**`/signup`** (`app/(auth)/signup/page.tsx`, replacing the Phase 1 placeholder)
- Client component form (email, password, confirm password) submitting to a Server Action `signUpAction` in a new `app/(auth)/signup/actions.ts`
- `signUpAction`: calls `createClient()` from `lib/supabase/server.ts`, then `supabase.auth.signUp({ email, password })`
  - If `data.session` is present → redirect to `/onboarding`
  - If `data.session` is null but `data.user` is present (confirmation pending) → return a state flag the form uses to show "Check your email to confirm your account" instead of redirecting
  - If error → return the error message for inline display
- Link to `/login` for existing users

**`/login`** (`app/(auth)/login/page.tsx`, replacing the Phase 1 placeholder)
- Client component form (email, password) submitting to a Server Action `signInAction` in `app/(auth)/login/actions.ts`
- `signInAction`: `supabase.auth.signInWithPassword({ email, password })` → redirect to `/feed` on success, return error message on failure
- Reads a `?reason=auth` search param: if present, the client component fires a `sonner` toast ("Sign in to continue") on mount — this is how page-level protection (below) communicates why the user landed here
- Link to `/signup` for new users

**`/auth/callback`** (`app/auth/callback/route.ts`, new — a Route Handler, not a page)
- Standard Supabase SSR callback pattern: reads the `code` query param, calls `supabase.auth.exchangeCodeForSession(code)`, then redirects to `/onboarding` (new users) — since this app has no "already has a profile" distinction to branch on yet, always redirecting to `/onboarding` is correct: the onboarding page itself checks whether a profile already exists and redirects to `/feed` if so (see below)

**`/onboarding`** (`app/onboarding/page.tsx`, replacing the Phase 1 placeholder)
- Server component: gets the current session via `lib/supabase/server.ts`; if no session, redirect to `/login`
- Checks if a `profiles` row already exists for `auth.uid()`; if so, redirect to `/feed` (handles a user re-visiting `/onboarding` or arriving via `/auth/callback` after already completing onboarding)
- Renders a client component form (username, optional bio) submitting to a Server Action `completeOnboardingAction` in `app/onboarding/actions.ts`
- `completeOnboardingAction`: inserts into `profiles` (`id = auth.uid()`, `username`, `bio`). On a unique-constraint violation (username taken), returns a friendly inline error ("That username is taken — try another"). On success, redirects to `/feed`

### Session-aware nav

`components/ToolboxNav.tsx` becomes a server component (it already needs no client interactivity beyond what's described here):
- Fetches the current session server-side via `lib/supabase/server.ts`
- Logged out: renders the existing Sign In / Sign Up buttons (linking to `/login` / `/signup`)
- Logged in: renders `<Avatar />` (new shared component — initials fallback, since avatar upload isn't built yet) + username + a "New Post" button (linking to `/post/new`) + a sign-out button
- Sign-out button posts to a Server Action `signOutAction` in a new `lib/auth/actions.ts`: calls `supabase.auth.signOut()`, redirects to `/`

### Shared auth helper

`lib/auth/require-auth.ts` (new): a small server-side helper, `requireAuth()`, that gets the current session and redirects to `/login?reason=auth` if absent, otherwise returns the session/user. Used by `/onboarding` and `/post/new` now; later phases (Task-level actions for nail/upvote/comment/follow) will call this same helper rather than reinventing the check.

`/post/new` (`app/post/new/page.tsx`) is updated from its Phase 1 placeholder to call `requireAuth()` at the top of the server component — since post creation itself isn't built until Phase 4, the page still just renders placeholder text ("New Post — coming in Phase 4") but now demonstrates/proves the protection pattern end-to-end.

### Toasts

- `sonner`'s `<Toaster />` mounted once in `app/layout.tsx`, positioned and themed via `sonner`'s style-override props to match the palette (dark charcoal background, off-white text, toolbox-red accent for error toasts)
- Used for: the `?reason=auth` redirect explanation on `/login`, the sign-out confirmation, and inline form errors surface as regular form UI (not toasts) since they're tied to a specific field/action rather than a page-load event

## Testing / verification

- `npm run build` succeeds with no type errors
- Manual flow test against a real (or the user's) Supabase project:
  1. Sign up with a new email/password → lands on `/onboarding` (or sees "check your email" if confirmation is enabled)
  2. Complete onboarding with a username → lands on `/feed`, `profiles` row exists with correct `id`/`username`
  3. Nav shows avatar + username + New Post + sign out
  4. Sign out → nav reverts to Sign In/Sign Up, redirected to `/`
  5. Log back in with the same credentials → lands on `/feed`
  6. Visit `/post/new` or `/onboarding` while logged out → redirected to `/login?reason=auth`, toast appears
  7. Try to onboard with a username that's already taken → friendly inline error, no crash

## Open questions

None — resolved during brainstorming.
