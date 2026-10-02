# Project architecture
- Keep the existing React/Vite routes and Lovable Cloud data integrations as the active application contract; the uploaded Go-only mission prompt describes a different, unavailable server.
- Keep interface audio opt-in in browser preferences, shared by all `useSound` callers; this prevents unexpected playback while preserving tactile feedback.
- Store new-account interests in `user_interests` and rank existing live streams by matching category; this personalizes verified content without inventing content.