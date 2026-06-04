
# SIGMA Mega-Build Plan

Bundles every request into one round. Built in dependency order so each layer unlocks the next. Virtual coins only (no Stripe yet). Cursor OFF by default. Clan Wars support text + audio + video.

## Phase 1 — Critical bug fixes (do first)

1. **Auth page flashing / can't reach /you after login**
   - Root cause: `useAuth` re-runs `setLoading(false)` twice and `Auth.tsx` calls `navigate('/')` even when session listener hasn't fired, so the new session redirects mid-render.
   - Fix: in `Auth.tsx`, after `signIn`/`signUp` success, wait for `onAuthStateChange` (await session) then `navigate('/you', { replace: true })`. Add a `<Navigate to="/you" />` guard when `user` already exists.
   - Add `RequireAuth` wrapper for `/you`, `/studio`, `/messages`, `/settings`, `/go-live` so they redirect to `/auth` cleanly instead of rendering a blank/blocked page.

2. **Cursor tracking control**
   - Move `<TargetCursor />` out of `main.tsx` into a new `<CursorProvider>` that reads `localStorage.sigma.cursor` (default `false`).
   - Add toggle in Settings → Appearance: "Custom animated cursor".
   - Hide on touch devices via `(pointer: coarse)` media query.

3. **LineWaves replaces Galaxy on Auth**
   - Install `ogl`. Add `src/components/LineWaves.tsx` + `LineWaves.css` from supplied source.
   - Swap `<Galaxy />` in `Auth.tsx` for `<LineWaves brightness={0.25} colorCycleSpeed={0.6} />` with the existing dark vignette over it.

## Phase 2 — Backend schema (one migration)

New tables (all RLS-protected):

- `friendships` (requester_id, addressee_id, status: pending/accepted/blocked, created_at) — used for Facebook-style friend graph.
- `friend_invites` (sender_id, recipient_id, context_type: stream/post/short/vidroom, context_id, message, status, created_at) — "join me watching X".
- `wallets` (user_id PK, coins int default 0) + `coin_transactions` (user_id, delta, reason, ref_id) — virtual currency ledger.
- `gifts_catalog` (id, name, icon, coin_cost, rarity).
- `gift_sends` (sender_id, recipient_id, context_type, context_id, gift_id, coin_value, created_at) — powers top gifters & Clan Wars scoring.
- `clans` (id, name, slug, owner_id, visibility: public/private/invite, banner_url, description, member_count).
- `clan_members` (clan_id, user_id, role: owner/officer/member).
- `clan_wars` (id, clan_a, clan_b, status, started_at, ends_at, winner_clan_id) — 5-min match.
- `clan_war_gifts` (war_id, sender_id, clan_id, coin_value, created_at) — feeds real-time scoreboard.
- `societies` (id, name, invite_code, charter_md, gov_type: democracy/council/monarchy).
- `society_members` (society_id, user_id, role, voting_power).
- `society_proposals` (id, society_id, author_id, title, body, status, ends_at) + `society_votes`.
- `chat_rooms` (id, kind: clan/society/public, owner_id, stream_kind: text/audio/video, is_live).
- `chat_room_messages` (room_id, user_id, content, created_at).
- `hashtags` (id, tag unique) + `post_hashtags` join table; trigger auto-extracts `#tags` from `posts.content`.
- `reports` (reporter_id, target_type: stream/post/short/comment/user, target_id, reason, details, status).
- `ratings` already exists — add `avg_rating` view per target.
- `user_ranks` materialized view (creator score = followers·1 + gift_coins_received·2 + avg_rating·100 + posts·0.5).
- Realtime publication: add `chat_room_messages`, `clan_war_gifts`, `friend_invites`, `gift_sends`.

RLS: members-only for clan/society chat & gifts; public read on aggregates; sender-only on transactions.

## Phase 3 — Friends, search, recommendations

- `src/pages/Friends.tsx`: tabs "Friends / Requests / Suggested / Search".
- Edge function `friend-recommendations`: Facebook-style — mutual friends weight 5, shared communities 2, shared hashtags 1, recent co-viewers 3. Returns top 20.
- User search: Supabase `ilike` on `profiles.username/display_name` + hashtag results.
- "Invite to watch" button on Watch, Shorts, Feed PostCard, VidRoom → opens friend picker → inserts `friend_invites` → recipient gets realtime notification with deep link.

## Phase 4 — Engagement upgrades

- **Comment-on-comment**: add `parent_id` to `post_comments`; `CommentsSheet` renders threaded replies.
- **Conversation engagement**: reactions on chat messages (`message_reactions` table), typing indicator already in `usePresence`.
- **Top fans / commenters / gifters panel** on Watch page right rail: queries `gift_sends`, `chat_messages`, `post_comments` filtered to the stream — leaderboard with podium UI.

## Phase 5 — Virtual coins & gifts

- Daily login bonus + earn coins via posting/streaming (server-side via edge function `coin-grant`).
- Gift drawer (`StreamGiftPanel` already exists) wired to `wallets` + `gift_sends`; deducts coins atomically through `send_gift` SQL function (SECURITY DEFINER).
- Gift overlay animation already present; trigger from realtime channel.

## Phase 6 — Chat rooms (3 kinds)

- `src/pages/ChatRoom.tsx` rebuilt with kind selector: **Public**, **Clan**, **Society**.
- Audio/video rooms: reuse `useWebRTC` hook, signaling over Supabase Realtime broadcast channel.
- Society pages: charter, member roster, proposals + voting UI.
- Clan page: roster, war history, "Challenge clan" button.

## Phase 7 — Clan Wars

- Creator opens "Start War" → picks opponent or open challenge → 5-min countdown.
- Live scoreboard component subscribes to `clan_war_gifts` realtime; bar chart shows running totals; winner auto-decided by edge function `finalize-war` at `ends_at`.
- Optional live broadcast: text/audio/video tied to the war room.
- Visibility option (public/private/invite-only) honored via RLS.

## Phase 8 — Hashtags, ratings, ranking

- `#tag` parser in PostCard renders clickable chips → `/tag/:tag` page (new route) listing posts/shorts/streams.
- 5-star rating already in `ratings` table — surface average + count on PostCard, Watch, Profile.
- `/rankings` page: filters Creators / Clans / Societies, fed by `user_ranks` view + edge `rank-feed` for AI tie-breaks.

## Phase 9 — You page (TikTok/YT-style profile)

- Header with banner, avatar, bio, follower stats.
- Tabs: Posts / Shorts / Streams / Gallery / About.
- Gallery uploader → `user-gallery` bucket (already exists).
- Edit profile inline.

## Phase 10 — Contextual Report

- `<ReportButton targetType targetId />` opens a sheet inserting into `reports`.
- Mounted on Watch (stream menu), Shorts overlay, PostCard menu, comment menu, profile menu. Existing `/report` page becomes the user's submitted-reports list.

## Phase 11 — Settings page

Sections: Account · Profile · Privacy · Notifications · Appearance (theme + cursor toggle + reduce motion) · Wallet (coin balance + history) · Friends & Blocking · Verification (KYC, existing) · Sessions · Danger zone (delete account).

## Phase 12 — Bug sweep + UML

- Run typecheck, lint, security scan, supabase linter; fix all findings.
- Replace any remaining mock data with real queries (data-integrity rule).
- Generate `SIGMA_v2_Architecture.drawio.xml` (importable in draw.io on Ubuntu) AND a `.mmd` Mermaid version covering: tables + relationships, edge functions, realtime channels, frontend route map, Clan War state machine. Saved to `/mnt/documents/`.

---

## Technical notes

- Edge functions to add: `friend-recommendations`, `send-gift`, `coin-grant`, `finalize-war`, `extract-hashtags`, `report-triage`.
- Realtime channels: `clan-war:{id}`, `chat-room:{id}`, `presence:{room}`, `notif:{userId}`.
- WebRTC: simple mesh up to 8 peers; SFU is out of scope v1.
- All money values are coin integers — no payment provider wired (Stripe deferred).
- File scope estimate: ~12 new pages, ~25 new components, 1 large migration, 6 edge functions. Will land in a single build round but is large; expect a long diff.

## Out of scope (call out)

- Real payments / payouts (waiting on user to choose Stripe vs Paddle).
- MongoDB bridge stays as-is (needs Atlas creds).
- Native push notifications beyond browser Web Push already implemented.
