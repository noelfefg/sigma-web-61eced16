## Goal

Integrate the **Stepper** component (React Bits, JS + CSS, `motion` dep) and use it to power:

1. A redesigned multi-step **Auth** flow (`/auth`)
2. A new **Auth Test** page (`/auth-test`) for verifying signup/login/session/signout end-to-end
3. A small **search test** harness using the stepper to walk through query → filters → results

## Files

**New**
- `src/components/ui/stepper/Stepper.jsx` — full component source from React Bits (as provided)
- `src/components/ui/stepper/Stepper.css` — provided styles, with color tokens swapped to design-system HSL vars (`hsl(var(--primary))` instead of `#5227FF`, `hsl(var(--muted-foreground))` instead of `#a3a3a3`, etc.) so it matches SIGMA's dark theme
- `src/pages/AuthTest.tsx` — diagnostic page using Stepper: Step 1 sign up (email/pw/username) → Step 2 sign in check → Step 3 session/profile fetch → Step 4 sign out + result summary. Shows live pass/fail per step.
- `src/pages/SearchTest.tsx` (optional but requested) — Stepper-driven search: Step 1 query input → Step 2 filter chips (users / streams / posts) → Step 3 results list pulled from Supabase.

**Edited**
- `src/App.tsx` — register routes `/auth-test` and `/search-test` (public, no `RequireAuth` so signup can be tested)
- `src/pages/Auth.tsx` — refactor existing form into a 3-step Stepper variant:
  - Step 1: choose mode (sign in / sign up)
  - Step 2: credentials (email, password, username if signup)
  - Step 3: confirm + submit
  - Keeps existing `useAuth().signIn / signUp` calls, toast, `<Navigate to="/you">` redirect. Glass card + LineWaves background preserved.
- `package.json` — add `motion` dependency (the component imports from `motion/react`, separate from existing `framer-motion`)

## Technical notes

- Stepper source is kept as `.jsx` (untyped) since React Bits ships it that way; project already mixes TS/JSX-tolerant config.
- CSS tokens to remap:
  - `#5227ff` → `hsl(var(--primary))`
  - `#a3a3a3` / `#52525b` → `hsl(var(--muted-foreground))` / `hsl(var(--border))`
  - `box-shadow` kept but reduced opacity so it reads on dark bg
  - `.step-circle-container` gets `background: hsl(var(--card))` and `border: 1px solid hsl(var(--border))`
- AuthTest writes results to local state only — no DB writes beyond the normal `signUp` profile insert already in `useAuth`.
- SearchTest uses existing `supabase` client with `.ilike` queries against `profiles`, `streams`, `posts` (read-only).
- No changes to backend, schema, RLS, or existing auth logic.

## Out of scope

- Replacing the queued ChatRoom/Society/Wallet work
- Any change to `useAuth` hook itself
- Styling overhaul of other pages

Say **Approve plan** and I'll implement.