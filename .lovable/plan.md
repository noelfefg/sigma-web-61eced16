# SIGMA v3 — Go Backend + Realtime Redesign

## Architecture (hybrid, nothing breaks)

```text
┌─────────── React (Vite) ───────────┐
│  Iconify icons · Apollo · Socket.IO │
└──────┬───────────────┬──────────────┘
       │ REST/GraphQL  │ WebSocket
       ▼               ▼
┌─────────────── Go server (you host) ───────────────┐
│  Gin HTTP · gqlgen (GraphQL) · go-socket.io        │
│  WebRTC signaling (Pion) · JWT verify (Supabase)   │
│  Notification fan-out · Clan/War engine            │
└──────┬──────────────────────────┬──────────────────┘
       │                          │
       ▼                          ▼
  Postgres (Lovable Cloud)   MongoDB Atlas
  users, clans, wallets,     chat_messages,
  streams, gifts (source     notifications log,
  of truth, RLS stays)       analytics events,
                             webrtc room state
```

**Frontend stays pointed at Lovable Cloud for auth + core data** (so preview keeps working). The new Go server is opt-in via `VITE_GO_API_URL` — when unset, app falls back to current Supabase calls. Zero regression risk.

## Deliverables

### 1. `/server` — Go module (you deploy to Railway/Fly/VPS)
```
server/
  cmd/api/main.go              # entry: gin + socket.io + graphql mount
  internal/
    auth/jwt.go                # verifies Supabase JWT (JWKS)
    config/env.go              # env loader (.env.example included)
    db/postgres.go             # pgx pool → Lovable Cloud PG
    db/mongo.go                # mongo-driver → Atlas
    graph/                     # gqlgen generated + resolvers
      schema.graphqls          # messaging + clan + notification API
      resolver.go
    realtime/
      socket.go                # go-socket.io rooms: clan:{id}, dm:{id}, stream:{id}
      webrtc.go                # Pion SFU-lite signaling
      notifications.go         # pub/sub fan-out (Postgres LISTEN/NOTIFY + WS push)
    clans/
      service.go               # create/join/leave/promote
      wars.go                  # 5-min war state machine + winner finalization
    notifications/
      service.go               # create → persist Mongo → push WS → optional web-push
  Dockerfile
  docker-compose.yml           # local: api + mongo + redis
  Makefile                     # make dev / make gen / make test
  README.md                    # deploy guide (Railway one-click)
  .env.example
```

Tech: Go 1.22, gin-gonic, 99designs/gqlgen, googollee/go-socket.io v2, pion/webrtc v4, jackc/pgx v5, mongo-driver, golang-jwt v5, zap logger, testify.

### 2. Frontend wiring
- `bun add @iconify/react @apollo/client graphql socket.io-client` — replace `lucide-react` icons gradually via `<Icon icon="solar:..." />` wrapper (`src/components/ui/Icon.tsx`); keep lucide as fallback.
- `src/lib/apollo.ts` — Apollo client pointing at `${VITE_GO_API_URL}/graphql` with auth link injecting Supabase JWT.
- `src/lib/socket.ts` — singleton `io()` connection, auto-reconnect, JWT on handshake.
- `src/hooks/useGoNotifications.ts` — subscribes to `notif:{userId}` socket room; merges with existing `useNotifications` so toast + bell update in realtime regardless of source.
- `src/components/notifications/NotificationCenter.tsx` — bell dropdown + full-page `/notifications` route with tabs: All / Mentions / Gifts / Clans / System; mark-all-read, group by day, in-app + browser push.
- Feature-flag: when `VITE_GO_API_URL` is empty, everything works on Supabase as today.

### 3. Clan system (full)
Schema lives in Postgres (Lovable Cloud — migration in same round):
- `clans` (exists) — add `tag` (3-5 char), `xp`, `level`, `treasury_coins`.
- `clan_invites` (clan_id, inviter_id, invitee_id, status, expires_at).
- `clan_announcements` (clan_id, author_id, body, pinned).
- `clan_war_rounds` (war_id, round_no, ends_at) — for multi-round wars.
- RLS: read public clans, members read private, officers+ manage.

Pages/components:
- `/clans` (already exists) → Browse + Create + My Clans tabs.
- `/clans/:slug` — Overview · Members · Wars · Announcements · Treasury · Settings (officer-gated).
- `ClanWarLive.tsx` — Socket.IO room `war:{id}`, live scoreboard, gift-to-clan button, countdown.
- `ClanChatRoom.tsx` — text/audio/video tabs, Socket.IO for text, Pion-relayed WebRTC for AV.

### 4. Realtime notifications (pro)
- **Live**: Socket.IO push from Go (`notif:{userId}` room) → toast + bell badge instantly.
- **Delayed/batched**: cron worker in Go emits digest events (e.g. "5 new gifts in the last hour") via Mongo aggregation.
- **Offline**: Web Push (VAPID) using `web-push-go`; service worker already exists (`public/sw.js`) — extend to handle `push` events.
- **History**: full log in Mongo `notifications_log` (queryable by GraphQL), state mirrored in PG `notifications` for RLS reads from the existing frontend hook.

### 5. UML / architecture docs (`/mnt/documents/`)
- `SIGMA_v3_System.drawio` — C4 Container + Component view, every service, every channel, every DB.
- `SIGMA_v3_DB.drawio` — full ER (PG tables + Mongo collections side-by-side, dotted lines = cross-store refs).
- `SIGMA_v3_Sequence.mmd` — Mermaid: login → message send → gift → clan war finalize.
- `SIGMA_v3_StateMachine.mmd` — Clan War lifecycle (idle→challenged→accepted→live→ended→settled).
- `SIGMA_v3_Deployment.drawio` — Browser · Lovable Cloud · Go server · Mongo Atlas · Redis · Web Push.

All importable in draw.io desktop (Ubuntu), with deep detail (multiplicity, FKs, channel names, payload schemas).

## Bug avoidance plan
1. **Don't rip Supabase out.** Keep all existing pages working on current client. Go server is additive.
2. **Single source of truth per entity** — PG for relational, Mongo for high-volume append-only. Documented in UML.
3. **JWT verification only** in Go (no second user store). Supabase remains identity provider.
4. **Migrations** run via existing `supabase--migration` tool, reviewed before apply.
5. **Type generation**: gqlgen on Go side, `graphql-codegen` on TS side → no hand-written types drift.
6. **CI Make targets** (`make lint test`) included; Dockerfile multistage.

## Out of scope this round
- Actually deploying the Go server (you do that — README has one-click Railway button).
- Replacing every lucide icon (we'll swap incrementally; new components use Iconify from day 1).
- SFU at scale (Pion mesh is fine ≤8 peers, SFU is later).
- Payment provider (still virtual coins).

## Order of execution (this round)
1. Postgres migration: clan extensions + invites + announcements + war rounds.
2. `/server` Go scaffold: full module, GraphQL schema, Socket.IO rooms, WebRTC signaling, Dockerfile, README.
3. Frontend: Iconify wrapper, Apollo client, socket singleton, NotificationCenter, ClanWarLive, ClanChatRoom, /clans/:slug page.
4. UML bundle written to `/mnt/documents/`.
5. Memory updates: backend is now hybrid Go + Lovable Cloud; icons via Iconify.

Estimated diff: ~30 new files, ~10 edits. Big but bounded.
