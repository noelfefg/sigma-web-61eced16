# Plan: Continue Build + You Page Mobile Redesign

## 1. ChatRoom WebRTC rebuild (`src/pages/ChatRoom.tsx`)
- Use existing `useWebRTC` hook to mesh-connect clan/society room members
- Audio/video toggle, mute, leave; tile grid of participants
- Text chat side panel using existing `messages` realtime channel scoped by room id

## 2. Society Governance UI (`src/pages/Community.tsx` extension)
- Proposals list (title, status, deadline) + vote yes/no with weight = follower count
- New proposal dialog; tally bar
- Tables: `society_proposals`, `society_votes` (new migration)

## 3. Wallet Top-up flow
- New `WalletDialog` mounted in `UserDropdownMenu`
- Coin packs (100/500/1000) → MTN MoMo via existing `MTNMomoDialog`
- Credits `wallets.balance` via secure RPC `top_up_wallet`

## 4. You Page mobile redesign (`src/pages/You.tsx`)
Current layout is desktop-first with floating avatar + small cards. Mobile feels cramped at 1032px viewport and worse on phones.

New mobile-first structure:
```text
┌─────────────────────────┐
│  BANNER (rounded-b-3xl) │  h-32 on mobile, h-48 desktop
│       [edit pencil]     │
├──────●──────────────────┤  avatar overlaps banner -bottom-10
│   Display Name      ✎   │
│   @handle               │
│  120 followers · 45 fol │
│ ┌─────────────────────┐ │
│ │ Bio (tap to edit)   │ │
│ └─────────────────────┘ │
│ [Go Live] [Share] [⚙]   │  full-width primary action row
├─────────────────────────┤
│ Stat pills (4 cols)     │  Views · Streams · Gifts · Earn
├─────────────────────────┤
│ Tabs: Overview|Analytics│  sticky under banner
├─────────────────────────┤
│ Quick links list rows   │  taller touch targets (h-14)
│ Gallery 2-col grid      │
└─────────────────────────┘
```

Key mobile changes:
- Remove the always-floating top-right avatar (clashes with bottom nav crowd)
- Single-column stack, generous spacing (`space-y-5`), large tap targets (`h-12`+)
- Avatar overlaps banner instead of separate row
- Action buttons become a 3-button bar (Go Live / Share profile / Settings) — full width on mobile, inline on `md:`
- Stat row with 4 compact pills replacing scattered numbers
- Quick sections become full-width list rows on mobile, 3-col grid on `md:`
- Gallery: `grid-cols-2 md:grid-cols-3 gap-2`, square aspect, hover-only delete on desktop / long-press menu on mobile
- Sticky tab bar under banner

Desktop layout preserved via `md:` breakpoints.

## 5. Contextual ReportButton sweep
- Already on Watch/Shorts/PostCard/Comments — verify; add to `Profile.tsx` header and `Channel.tsx`

## Out of scope (defer)
- draw.io export (already shipped)
- Top-fans leaderboard (already shipped)
- Comment-on-comment (already shipped)

## Files touched
- `src/pages/You.tsx` (mobile redesign)
- `src/pages/ChatRoom.tsx` (WebRTC)
- `src/pages/Community.tsx` + new `src/components/society/*`
- `src/components/wallet/WalletDialog.tsx` (new)
- `src/components/layout/UserDropdownMenu.tsx` (mount wallet)
- `src/pages/Profile.tsx`, `src/pages/Channel.tsx` (ReportButton)
- New migration: `society_proposals`, `society_votes`, `top_up_wallet` RPC
