# Sigma Frontend Transformation — Premium Dark Social + Live Universe

Refactor the existing Vite/React frontend in place. No rebuild, no route removal, no loss of auth, realtime, or data wiring.

## What already exists (verified)

- Pages: Auth, Browse, Channel, Feedback, Following, GoLive, Messages, Profile, Settings, Watch, You, OAuthConsent, NotFound.
- Sigma primitives already started: GlassCard, OrbitalAvatar, LiveBadge/ViewerCount, StreamCard, CreatorCard, ChatMessage, ReactionOverlay.
- shadcn UI installed: carousel, slider, hover-card, dropdown-menu, navigation-menu, sidebar, chart (recharts), sheet, drawer, badge, avatar, skeleton.
- Backend tables in use: profiles, posts, post_likes, post_comments, hashtags, followers, direct_messages, conversations, message_reactions, notifications, streams, chat_messages, chat_rooms, chat_room_messages, stream_polls, stream_poll_votes, feedback, reports, categories, stories, shorts.
- Realtime through Supabase channels (`useWebSocket`, `usePresence`, `useNotifications`).
- Missing from the component set: Message/Bubble system, Item, InputGroup/Search, AudioPlayer, LiveWaveform, TranscriptViewer, Questionnaire, AvatarGroup, dashboard shell.
- Not backed by data today: bookmarks, audio/video message attachments, stream analytics aggregates. These need small schema additions or must stay as clean extension points.

## Phase 1 — Design system and shell

- Extend the Sigma tokens in `index.css`: charcoal/black layers, silver highlights, thin borders, glass surfaces, soft glow, restrained motion (respect `prefers-reduced-motion`).
- Desktop: top navigation built on the shadcn `navigation-menu` (Home, Discover, Live, Messages, Notifications, Profile, More), plus contextual right panels.
- Mobile: premium bottom navigation (Home, Discover, Live, Messages, Profile) with subtle selected-state glow; drawer for overflow.
- Real Sigma logo asset used as brand mark everywhere.

## Phase 2 — Shared component groups

New folders: `components/navigation`, `messaging`, `media`, `live`, `analytics`, `profile`, `posts`, `common`.

- Messaging/Bubble: Message, MessageAvatar, MessageContent, MessageFooter, Bubble, BubbleGroup, BubbleReactions, Marker — one system reused in DMs, stream chat, and stream rooms. Text, reactions, delivered/read, typing, grouped bubbles.
- Avatar/AvatarGroup + AvatarBadge (online/live/host) reused across profiles, viewers, chat, followers.
- Badge variants: verified, creator, live, host, guest, online, category.
- Carousel variants: live rail, trending, creators, mixed media, posts.
- Slider wired into media controls (progress, volume, speed).
- DropdownMenu action sets (post, stream, message, account) with mobile bottom-sheet equivalents.
- HoverCard user preview on desktop, tap sheet on mobile.
- Item (ItemMedia/Content/Actions/Title/Description) for notifications, settings, verification, metadata rows.
- InputGroup search with tabs: All, People, Posts, Live, Hashtags.

## Phase 3 — Media system

- Image (preview, fullscreen, carousel), Video (play/pause, progress, volume, fullscreen), Audio.
- AudioPlayer (play/pause, time, progress, speed, track), LiveWaveform for voice recording states, TranscriptViewer rendered only when transcript data exists.
- Media always referenced by backend URL, never held in state.

## Phase 4 — Screens

- Home: personalized feed of posts, media, and live cards with reactions, comments, shares, bookmarks.
- Discover: search-first with trending, hashtags, creators, popular posts, live rails.
- Live: multi-stream grid + carousels, host avatars, viewer counts, categories, previews.
- Stream viewer: immersive full-screen mobile layout (top host bar, dominant video, right action rail, bottom chat + composer), desktop expanded player with side chat; polls and reactions layered in.
- Host controls: stream state, duration, title, category, chat moderation, viewer management, room controls.
- Messages: full bubble system with audio messages, waveform recording, playback, reactions, read/typing state.
- Profile: banner, avatar, badges, bio, Sigmatize stats, posts/media/live tabs.
- Notifications: Item rows for follows, likes, comments, messages, live, verification.
- Post creation: text, hashtags, multi-media with carousel preview, reorder and remove.
- Verification: request + status screens with badge/state UI.
- Settings: Account, Security, Notifications, Privacy, Streaming, Support, Logout.
- Onboarding Questionnaire: interests and live-category preferences stored on the profile.
- Creator Studio (dashboard shell, separate from the social surfaces): sidebar, KPI section cards, radial stacked chart for hot-moment summaries, stacked bar chart for activity timeline, data table for stream history.

## Phase 5 — States, realtime, accessibility, verification

- Loading, skeleton, empty, error, success states on every screen listed above.
- Keep Supabase realtime channels for messages, typing, presence, viewer counts, reactions, live events.
- Keyboard nav, focus rings, labels, contrast, accessible media controls.
- Run build and typecheck; fix all errors before finishing.

## Technical notes

- Vite/React Router only; any Next.js `Link`/router usage from reference code is adapted to `react-router-dom`.
- Data access stays on the existing Supabase client and hooks; no polling replacements for realtime.
- Backend additions kept minimal and only where a listed feature has no table: post bookmarks, message media/audio columns, and a stream analytics aggregate view. Each new table gets GRANTs and RLS.
- Clans, store, gifts, payments, AI moderation, and watch-together stay out of the UI; only extension points remain.

## Suggested execution order

Phases run sequentially; each phase ends with a build check so the app stays usable throughout.
