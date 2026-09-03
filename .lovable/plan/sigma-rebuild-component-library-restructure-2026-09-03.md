# Sigma Rebuild — Component Library Restructure

Rebuild the Sigma frontend in place around the supplied shadcn component inventory: restructured information architecture, all 14 component groups applied, and real analytics with new metric tracking. Backend auth, realtime, messaging and streaming logic stay intact.

## Visual direction

Grey / charcoal premium identity, real Sigma logo, media-first social feel. Existing tokens in `src/index.css` (black #282828 family, silver glass, `sigma-glass`, `sigma-glow`, `sigma-sheen`) are the base — no new palette, no demo styling copied literally.

## New information architecture

Routes reorganized into four top sections, delivered through a `NavigationMenu` on desktop and the existing bottom tab bar on mobile:

```text
Discover   /            hero rail, live now, trending creators, categories
Live       /live/:id    player + chat + participants + hot-moment chart
           /go-live     broadcast console
Messages   /messages    DM list + bubble thread
More       /you  /profile/:username  /settings  /search  /studio
```

- `/` becomes Discover, built from carousels (live rail, trending, creators, recently watched).
- `/watch/:username` keeps working via redirect to the new Live route so no links break.
- `/search` is a new global search page with tabs: People, Posts, Hashtags, Streams.
- `/onboarding` is a new post-signup questionnaire capturing interests and live categories.
- `/studio` is a new creator dashboard (sidebar layout + charts + data table).

## Component group mapping

| Group | Where it lands |
| --- | --- |
| Messaging / Bubble | DMs, stream chat, watch-party chat; reactions, read state, typing |
| NavigationMenu | Desktop header sections |
| Questionnaire | `/onboarding` interests flow |
| Avatar / AvatarGroup | Viewers, chat participants, hosts and guests |
| Badge | Verified, Creator, Live, Host, Guest, Online, categories |
| Carousels | Discover rails and "Famous Sigma" creator rail |
| Slider | Volume, video and audio-message scrubbing, preferences |
| DropdownMenu | Account, post, stream, message overflow |
| HoverCard | Creator/user preview on any avatar or handle |
| Item | Notifications, settings rows, verification, metadata |
| InputGroup Search | Header search and `/search` page |
| Radial / stacked charts | Live hot-moment summary on the stream page |
| ChartAreaInteractive | Live activity timeline in `/studio` |
| DataTable | Stream history and post performance in `/studio` |

Existing shared pieces already built (`components/common/*`, `components/messaging/Bubble.tsx`, `components/media/*`, `components/sigma/*`) are reused and extended rather than duplicated.

## Analytics tracking (backend)

New tables so charts show real data that accumulates:

- `stream_metric_samples` — per-stream, per-minute snapshot: viewer count, chat count, reaction count, like count. Written from the stream page while live.
- `stream_events` — discrete events (join, chat, reaction, share) used for hot-moment peaks.

Both get GRANTs, RLS (public read for the stream owner's public streams, insert restricted to authenticated participants) and an index on `(stream_id, captured_at)`. No fabricated data: empty states render when a stream has no samples.

## Technical notes

- No new frontend dependencies; shadcn primitives already present (`navigation-menu`, `hover-card`, `carousel`, `chart`, `sidebar`, `slider`, `table`) are used. `bubble`, `message`, `marker`, `questionnaire` and `item` are added as project components in the existing style.
- Next.js-isms in the supplied code (`"use client"`, `next/link`) are converted to Vite + `react-router-dom`.
- All Supabase queries, `useAuth`, `useWebSocket`, `usePresence`, `useNotifications`, `useWebRTC` and `StreamPlayer` (hls.js + YouTube) are preserved untouched.
- Strict typing, shared models extended in `src/types/sigma.ts`; no `any`.
- Work order: tokens/primitives → shell + navigation → Discover → Live → Messages → Profile/You/Settings → Search + Onboarding → Studio + tracking → build/lint pass.

## Out of scope

Clans, societies, store, payments and gifts stay as they are today — this rebuild does not revive or restyle them.
