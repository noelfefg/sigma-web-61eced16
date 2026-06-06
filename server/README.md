# SIGMA Go Backend

Hybrid Go server that augments Lovable Cloud (Supabase) with:

- **GraphQL API** (gqlgen) for messaging, clans, notifications
- **Socket.IO** rooms for live chat, gifting, clan war scoreboard
- **WebRTC signaling** (Pion) for clan voice/video rooms
- **MongoDB Atlas** for high-volume append-only data (chat log, analytics, notification history)
- **Postgres** (same Lovable Cloud DB) for relational source of truth via `pgx`
- **Supabase JWT verification** (JWKS) — no separate user store

The frontend keeps using Lovable Cloud for auth and core CRUD. This Go server is **opt-in**: set `VITE_GO_API_URL` in the frontend `.env` to enable.

## Local dev

```bash
cd server
cp .env.example .env   # fill in values
docker compose up      # api + mongo + redis
```

API: `http://localhost:8080`
GraphQL playground: `http://localhost:8080/playground`
Socket.IO: `ws://localhost:8080/socket.io/`

## Required env

| Var | Source |
| --- | --- |
| `PG_DSN` | Lovable Cloud → Project Settings → Database → Connection string |
| `MONGO_URI` | MongoDB Atlas |
| `SUPABASE_URL` | Lovable Cloud (`https://qlrdqnxsdpqiymcstycn.supabase.co`) |
| `SUPABASE_JWKS_URL` | `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` |
| `REDIS_URL` | Optional; enables horizontal scale of Socket.IO |
| `VAPID_PUBLIC` / `VAPID_PRIVATE` | Web Push keys (generate with `web-push generate-vapid-keys`) |
| `PORT` | Default 8080 |

## Deploy

### Railway
1. New Project → Deploy from Repo → pick `server/` as root.
2. Add env vars from `.env.example`.
3. Add Postgres + MongoDB plugins (or external Atlas).

### Fly.io
```bash
fly launch --dockerfile Dockerfile
fly secrets set PG_DSN=... MONGO_URI=...
fly deploy
```

After deploy, set `VITE_GO_API_URL=https://<your-domain>` in the frontend.

## Make targets

```
make dev        # go run ./cmd/api
make gen        # gqlgen generate
make test       # go test ./...
make lint       # golangci-lint run
make docker     # build container
```

## Architecture

See `/mnt/documents/SIGMA_v3_System.drawio` for the full C4 diagram.

Service boundaries:

```
cmd/api          → entrypoint, wires everything
internal/auth    → JWT verification (Supabase JWKS)
internal/db      → Postgres + Mongo pools
internal/graph   → gqlgen schema + resolvers
internal/realtime → Socket.IO + WebRTC + notification fan-out
internal/clans   → clan + war business logic
internal/notifications → create + persist + push
```
