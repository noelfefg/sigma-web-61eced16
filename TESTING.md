# TESTING.md — SIGMA Platform Testing Checklist

## 1. Authentication
- [ ] Sign up with email + password
- [ ] Verify email confirmation flow
- [ ] Sign in with valid credentials
- [ ] Sign out from sidebar / dropdown
- [ ] Protected pages redirect to /auth when not logged in
- [ ] Profile is auto-created on first sign-up

## 2. Feed (For You / Following)
- [ ] "For You" tab loads mixed content (posts, live streams, shorts)
- [ ] "Following" tab only shows content from followed users
- [ ] Tab switching has smooth animated indicator
- [ ] Infinite scroll loads more posts on scroll
- [ ] Compose box opens CreatePostDialog
- [ ] Post with text only works
- [ ] Post with image upload works
- [ ] PostCard displays: avatar, username, timestamp, content, media
- [ ] Like/unlike toggle works (optimistic UI)
- [ ] Double-tap to like on media works
- [ ] Comment sheet opens and loads comments
- [ ] New comment submission works
- [ ] Realtime: new posts appear without refresh
- [ ] Live stream cards show "LIVE" badge and link to /watch/:username
- [ ] Short cards show "Lil Vid" badge and link to /shorts

## 3. Stories (24h Disappearing Content)
- [ ] Stories bar appears at top of Feed
- [ ] "Your Story" button opens upload dialog
- [ ] Image upload creates a story
- [ ] Video upload creates a story
- [ ] Stories with gradient ring appear for users with active stories
- [ ] Clicking a story opens full-screen viewer
- [ ] Progress bars advance across stories
- [ ] Tapping advances to next story
- [ ] Close button dismisses viewer
- [ ] Stories older than 24h are not displayed
- [ ] Realtime: new stories appear without refresh

## 4. Shorts (Lil Vids) — Vertical Player
- [ ] /shorts route loads
- [ ] Full-screen vertical video player renders
- [ ] Video auto-plays, loops, and is muted by default
- [ ] Swipe up (touch) advances to next short
- [ ] Swipe down goes to previous short
- [ ] Mouse wheel scrolling navigates between shorts
- [ ] Double-tap triggers like heart animation
- [ ] Side action buttons visible (Like, Comment, Share, Views)
- [ ] Like toggles on/off with animation
- [ ] "Post Lil Vid" upload dialog works
- [ ] Username, caption, and music sticker overlay visible
- [ ] Progress dots at top indicate position
- [ ] Empty state shows when no shorts exist

## 5. Live Streaming
### Go Live Page
- [ ] /go-live loads for authenticated users
- [ ] Camera preview starts on "Start Preview" button click
- [ ] Camera/mic toggle buttons work
- [ ] Stream title, description, category fields work
- [ ] "Go Live" creates stream record and starts broadcast
- [ ] "End Stream" stops stream and updates record
- [ ] AI Stream Assistant floating button appears
- [ ] AI: "Suggest Title & Tags" generates suggestions
- [ ] AI: Clicking suggested title fills in the title field
- [ ] AI: "Smart Moderation" toggle works
- [ ] Stream key and RTMP URL display and copy correctly

### Watch Page
- [ ] /watch/:username loads stream data
- [ ] Video player shows webcam for own stream
- [ ] Placeholder shows for viewer mode
- [ ] LIVE badge and viewer count display
- [ ] Follow/unfollow button works
- [ ] "Watch Together" links to Vid Room
- [ ] Stream gift panel opens and sends gifts
- [ ] Gift overlay animations render correctly
- [ ] Live reactions fire on button clicks
- [ ] Chat messages load and scroll
- [ ] Chat message sending works
- [ ] AI Stream Assistant appears
- [ ] Smart Moderation filters toxic messages in chat

## 6. Live Polls
- [ ] Stream owner sees "Create Poll" button
- [ ] Poll creation form: question + 2-4 options
- [ ] Poll appears on Watch page for all viewers
- [ ] Viewers can vote once per poll
- [ ] Vote results show animated percentage bars
- [ ] Voted option shows checkmark
- [ ] Stream owner can "End Poll"
- [ ] Realtime: votes update live for all viewers

## 7. Vid Room (Watch Together)
- [ ] /room/:roomId loads
- [ ] Room chat works via WebSocket broadcast
- [ ] Participant join/leave messages appear
- [ ] Video/stream content displays

## 8. Store
- [ ] /store loads items
- [ ] Category filter tabs work (All, Featured, Trending, etc.)
- [ ] Search filters items by title
- [ ] "Sell" form creates new store items
- [ ] "Add to Cart" button appears on hover
- [ ] Cart drawer opens with correct items
- [ ] Cart quantity and total calculate correctly
- [ ] Remove from cart works
- [ ] Checkout creates order + order_items records
- [ ] Empty cart state displays correctly
- [ ] Skeleton loaders show during loading

## 9. Creator Analytics (You Page)
- [ ] /you loads profile data
- [ ] "Overview" tab shows profile, sections, gallery
- [ ] "Analytics" tab shows stats cards (Followers, Views, Peak, Content)
- [ ] Viewer chart renders with Recharts
- [ ] Top streams list shows correctly
- [ ] Stats reflect real database data (no mock data)

## 10. Profile Management (You Page)
- [ ] Banner upload works
- [ ] Avatar upload works (both floating and inline)
- [ ] Edit profile dialog: display name, username, bio
- [ ] Username validation (lowercase, no special chars)
- [ ] Gallery image upload with caption
- [ ] Gallery image delete
- [ ] Follower/following counts display from database

## 11. Navigation
### Desktop Sidebar
- [ ] Sidebar toggle (expand/collapse) works
- [ ] Collapsed state shows only icons
- [ ] Active route is highlighted with bold text
- [ ] All nav links navigate correctly
- [ ] "Post" button / CreateMenu opens dropdown
- [ ] User section shows avatar and sign-out option

### Mobile
- [ ] Bottom tab bar shows 5 core items
- [ ] Hamburger menu opens mobile drawer
- [ ] Mobile drawer has all nav items
- [ ] Mobile CreateMenu in header works

## 12. Messaging
- [ ] /messages loads conversations
- [ ] Sending a direct message works
- [ ] Realtime message updates

## 13. Browse Page
- [ ] Categories load from database
- [ ] Live streams display with viewer counts
- [ ] Search filters content

## 14. Settings
- [ ] Account settings display user info
- [ ] KYC verification flow works (simulated)

## 15. Responsiveness
- [ ] Feed layout: single column on mobile, with sidebar on desktop
- [ ] Shorts: full-screen vertical player scales correctly
- [ ] Watch page: chat drawer hides on mobile
- [ ] Store: grid adjusts from 2 to 5 columns
- [ ] Navigation: sidebar on desktop, bottom bar on mobile

## 16. Real-time Features
- [ ] Feed updates when new posts are created
- [ ] Stories bar refreshes on new story uploads
- [ ] Poll votes update live
- [ ] Chat messages appear in real-time
- [ ] Stream viewer counts update

## 17. Error Handling & Edge Cases
- [ ] Empty states render gracefully for all lists
- [ ] Network errors show toast notifications
- [ ] Loading spinners/skeletons show during data fetches
- [ ] Unauthenticated users see sign-in prompts
- [ ] File upload errors are handled with feedback

## 18. PWA & Performance
- [ ] Service worker registers (`public/sw.js`)
- [ ] Manifest.json is present
- [ ] Network-first caching strategy works
- [ ] Page loads are smooth with skeleton states
- [ ] Framer Motion animations are buttery (60fps)
