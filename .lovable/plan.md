# Sigma Redesign — Premium Dark Universe

A redesign layered onto the existing frontend. No new project, no new router, no new API layer. All Supabase/auth/realtime logic stays exactly as-is; only presentation changes.

## What exists today (confirmed)

- Routes in `src/main.tsx`: `/` and `/browse` (Browse), `/following`, `/watch/:username`, `/channel/:username`, `/profile/:username`, `/auth`, `/go-live`, `/you`, `/messages`, `/settings`, `/feedback`.
- Layout: `components/layout/AppLayout.tsx` (bottom nav + header), `CreateMenu`, `UserSearch`, `UserDropdownMenu`, `Masthead`, `PopularStreamers`, `RecommendedCategories`, `LiveBackground`.
- Stream: `components/stream/StreamPlayer.tsx` (hls.js + YouTube embed), `LiveReactions.tsx`.
- Hooks: `useAuth`, `useWebSocket` (Supabase Realtime broadcast), `usePresence`, `useNotifications`, `useWebRTC`, `useSound`, `use-mobile`.
- Full shadcn UI set in `components/ui`, framer-motion + gsap already installed.
- Data access is Supabase client calls inside pages (`supabase.from(...)`), plus `src/lib/api.ts`.

## Plan

### Phase 1 — Design tokens
Extend `src/index.css` + `tailwind.config.ts` with Sigma tokens (all HSL, semantic, no hardcoded colors in components):
black `#080808`, bg `#0d0d0d`, surface `#151515`, surface-soft, border white/10, text `#f5f5f5`, muted `#8f8f8f`, silver `#cfcfcf`. Add utilities: `.sigma-glass`, `.sigma-glow`, `.sigma-sheen`, orbital keyframes. Keeps light-theme fallbacks so the existing theme toggle still works.

### Phase 2 — Sigma component library (`src/components/sigma/`)
New, reusable, strictly typed: `GlassCard`, `GlassButton` (a shadcn Button variant, not a fork), `OrbitalAvatar` (wraps existing `ui/avatar`), `LiveBadge`, `ViewerCount`, `StreamCard`, `CreatorCard`, `ChatMessage`, `MessageBubble`, `TypingIndicator`, `ReactionButton`, `ReactionOverlay`, `ProfileHeader`, `NotificationItem`, `MediaCard`, `SearchBar` (wraps existing `UserSearch` logic).

### Phase 3 — Shell and navigation
Restyle `AppLayout` into `AppShell` composition: `TopNav` (logo, search, nav, notifications, messages, avatar, Go Live) on desktop, `BottomNav` (Home, Live, Create, Messages, Profile) on all sizes as currently configured, plus `PageContainer`. Existing nav behaviour, drawer and routes preserved.

### Phase 4 — Discovery pages
- `Browse.tsx` becomes the immersive Home: hero live rail, recommended streams, creators — using `StreamCard`/`CreatorCard`, same queries.
- Add a `/live` route reusing the same Browse data hooks for a discovery-first grid (or keep Browse as both if you prefer fewer routes).
- `Following.tsx` restyled with the same cards.

### Phase 5 — Stream page
Rework `Watch.tsx` presentation only: full-bleed player, glass overlay (LiveBadge, ViewerCount, creator actions), glass chat panel on desktop, layered chat over video on mobile, `ReactionOverlay` wired to the existing `useWebSocket` broadcast channel. `StreamPlayer` gets premium controls (play/pause, mute, fullscreen, live indicator) while keeping hls.js/YouTube logic untouched.

### Phase 6 — Profile, Messages, Notifications, Settings
`Profile`/`Channel`/`You`: `ProfileHeader` + `OrbitalAvatar` + stats + media grid, existing Sigmatize wording and follow logic intact. `Messages`: conversation list, header, bubbles, composer, typing indicator on the current realtime code. `NotificationPanel`: grouped `NotificationItem` list with orbital indicators.

### Phase 7 — Polish and verification
Subtle framer-motion only (chat entry, hover, reactions, page transitions). Then `npm run build` and `npm run lint`, fix all TS/lint errors, remove dead code.

## Notes / decisions

- Gift system: gifts were previously removed from this app at your request and there is no gifts table anymore. I will build `GiftAnimation` + gift UI **only** if you want gifts back; otherwise Phase 5 ships reactions only.
- No `any`; reuse existing types from `src/integrations/supabase/types.ts` and page-level interfaces, adding shared `Stream`/`StreamMessage` types in `src/types/` where they are duplicated today.
- No new animation or data libraries added.
