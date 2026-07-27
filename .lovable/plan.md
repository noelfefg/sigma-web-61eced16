
# SIGMA MVP Cleanup

Goal: cut the frontend down to only what the backend actually supports, and polish what remains.

Assumption (say the word if wrong): the live data layer stays Lovable Cloud (Postgres + realtime), which already implements every capability in your list. The Go server scaffold stays in `server/` untouched, unused by the UI. Nothing new gets built on the backend.

## Remove (pages, routes, components, and their imports)

- Clans + clan wars: `Clans.tsx`, `src/components/clans/*`, clan war live/chat components
- Store / marketplace / payments: `Store.tsx`, `src/components/payments/*` (MTN MoMo dialog), gifts catalog UI, `Gifts.tsx`
- Creator economy & analytics: `CreatorStudio.tsx`, `Rankings.tsx`, `src/components/analytics/*`
- Fake AI / fake recommendations: `AIStreamAssistant.tsx`, algorithmic "For You" ranking UI and the `rank-feed` usage
- Mock/landing leftovers: `About`, `Awards`, `Contact`, `Portfolio`, `Services`, `Team`, `AnimationShowcase`, `Hero` marketing block, `figma/` folder
- Other unsupported: `Community.tsx`, `Friends.tsx` (mutual-follow suggestion algorithm), `Tag.tsx`, `SnapCamera.tsx`, `VidRoom.tsx`, `Shorts.tsx` if it has no backing table (verified before deleting)
- Any nav entries, buttons, and links pointing at the above

## Keep and improve

| Area | Route | Work |
| --- | --- | --- |
| Auth | `/auth` | Keep LineWaves design, tighten sign-in/up/reset states, no flashing |
| Feed | `/` | Simple chronological feed of posts (no fake ranking), infinite scroll, empty states |
| Profile | `/profile/:username`, `/you` | Public profile, avatar/banner, edit profile, followers/following lists |
| Follow | inline | Follow/unfollow button component reused everywhere |
| Messaging | `/messages` | Conversation list + thread, realtime, media/audio/video attachments |
| Notifications | bell + panel | Realtime, mark read |
| Comments | on posts/streams | Threaded, delete own |
| Streams | `/browse`, `/watch/:username`, `/go-live` | Stream list, player, stream chat, create stream |
| Feedback | `/feedback` | Keep as-is (backed) |
| Verification | new small form | Request verification, stored via existing feedback/report style table if present — otherwise marked placeholder |
| Settings | `/settings` | Profile, appearance/theme, cursor toggle, account |

## Technical notes

- Rewrite `src/main.tsx` routes to the reduced set; unknown paths → `NotFound`
- Rework `AppLayout` nav to: Home, Streams, Messages, Notifications, You (desktop top bar + mobile bottom bar)
- Delete now-orphaned hooks/libs (gift RPC helpers, clan hooks, payment utils, apollo/socket clients if unused after cleanup)
- Keep React + TS + Tailwind + shadcn + Framer Motion; motion used for page transitions, list stagger, and bottom-nav indicator
- Any control without a backend capability gets removed rather than stubbed; anything I must keep gets a visible "Coming soon" disabled state
- Run typecheck + a browser smoke pass over every remaining route at the end

## Out of scope

No database migrations, no new edge functions, no new backend endpoints.
