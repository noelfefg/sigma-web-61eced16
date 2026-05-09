
-- ============================================================
-- Phase 2: SIGMA social + gifting + clans + societies + reports
-- ============================================================

-- Threaded comments
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS parent_id uuid;

-- ============================================================
-- FRIENDSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  addressee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
);
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own friendships" ON public.friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can request friendship" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Either party can update friendship" ON public.friendships FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Either party can delete friendship" ON public.friendships FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE TABLE IF NOT EXISTS public.friend_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  context_type text NOT NULL CHECK (context_type IN ('stream','post','short','vidroom','clan','society')),
  context_id uuid NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.friend_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own invites" ON public.friend_invites FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send invites" ON public.friend_invites FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipients can update invites" ON public.friend_invites FOR UPDATE USING (auth.uid() = recipient_id);

-- ============================================================
-- VIRTUAL COINS / WALLETS / GIFTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id uuid PRIMARY KEY,
  coins integer NOT NULL DEFAULT 0 CHECK (coins >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  delta integer NOT NULL,
  reason text NOT NULL,
  ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own ledger" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.gifts_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text NOT NULL,
  coin_cost integer NOT NULL CHECK (coin_cost > 0),
  rarity text NOT NULL DEFAULT 'common'
);
ALTER TABLE public.gifts_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view gifts" ON public.gifts_catalog FOR SELECT USING (true);

INSERT INTO public.gifts_catalog (name, icon, coin_cost, rarity) VALUES
  ('Rose','🌹',1,'common'),
  ('Heart','❤️',5,'common'),
  ('Star','⭐',20,'rare'),
  ('Crown','👑',100,'epic'),
  ('Diamond','💎',500,'legendary'),
  ('Rocket','🚀',1000,'mythic')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.gift_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  context_type text NOT NULL CHECK (context_type IN ('stream','post','short','clan_war','profile')),
  context_id uuid,
  gift_id uuid NOT NULL,
  coin_value integer NOT NULL CHECK (coin_value > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gift_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view gift sends" ON public.gift_sends FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_gift_sends_context ON public.gift_sends(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_gift_sends_recipient ON public.gift_sends(recipient_id);

-- Atomic gift function
CREATE OR REPLACE FUNCTION public.send_gift(
  _recipient uuid, _gift_id uuid, _context_type text, _context_id uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sender uuid := auth.uid();
  v_cost int;
  v_send_id uuid;
BEGIN
  IF v_sender IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v_sender = _recipient THEN RAISE EXCEPTION 'Cannot gift yourself'; END IF;
  SELECT coin_cost INTO v_cost FROM public.gifts_catalog WHERE id = _gift_id;
  IF v_cost IS NULL THEN RAISE EXCEPTION 'Gift not found'; END IF;

  INSERT INTO public.wallets(user_id, coins) VALUES (v_sender, 0) ON CONFLICT DO NOTHING;
  INSERT INTO public.wallets(user_id, coins) VALUES (_recipient, 0) ON CONFLICT DO NOTHING;

  UPDATE public.wallets SET coins = coins - v_cost, updated_at = now()
    WHERE user_id = v_sender AND coins >= v_cost;
  IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient coins'; END IF;

  UPDATE public.wallets SET coins = coins + v_cost, updated_at = now() WHERE user_id = _recipient;

  INSERT INTO public.gift_sends(sender_id, recipient_id, context_type, context_id, gift_id, coin_value)
    VALUES (v_sender, _recipient, _context_type, _context_id, _gift_id, v_cost)
    RETURNING id INTO v_send_id;

  INSERT INTO public.coin_transactions(user_id, delta, reason, ref_id) VALUES
    (v_sender, -v_cost, 'gift_sent', v_send_id),
    (_recipient, v_cost, 'gift_received', v_send_id);

  RETURN v_send_id;
END;
$$;

-- ============================================================
-- CLANS + CLAN WARS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  owner_id uuid NOT NULL,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private','invite')),
  description text,
  banner_url text,
  member_count integer NOT NULL DEFAULT 1,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public clans" ON public.clans FOR SELECT USING (visibility = 'public' OR owner_id = auth.uid());
CREATE POLICY "Authenticated can create clans" ON public.clans FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update clans" ON public.clans FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete clans" ON public.clans FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.clan_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','officer','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clan_id, user_id)
);
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view clan members" ON public.clan_members FOR SELECT USING (true);
CREATE POLICY "Users can join clans" ON public.clan_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave clans" ON public.clan_members FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_clan_member(_user uuid, _clan uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.clan_members WHERE user_id = _user AND clan_id = _clan)
$$;

CREATE TABLE IF NOT EXISTS public.clan_wars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_a uuid NOT NULL,
  clan_b uuid NOT NULL,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private','invite')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','live','ended')),
  started_at timestamptz,
  ends_at timestamptz,
  winner_clan_id uuid,
  score_a integer NOT NULL DEFAULT 0,
  score_b integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clan_wars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view wars" ON public.clan_wars FOR SELECT USING (true);
CREATE POLICY "Clan owners create wars" ON public.clan_wars FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.clans WHERE id = clan_a AND owner_id = auth.uid())
);
CREATE POLICY "Clan owners update wars" ON public.clan_wars FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.clans WHERE (id = clan_a OR id = clan_b) AND owner_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS public.clan_war_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  war_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  clan_id uuid NOT NULL,
  coin_value integer NOT NULL CHECK (coin_value > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clan_war_gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view war gifts" ON public.clan_war_gifts FOR SELECT USING (true);
CREATE POLICY "Senders insert war gifts" ON public.clan_war_gifts FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE INDEX IF NOT EXISTS idx_clan_war_gifts_war ON public.clan_war_gifts(war_id);

-- ============================================================
-- SOCIETIES (invite-only governance groups)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.societies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  invite_code text NOT NULL UNIQUE DEFAULT substr(md5(random()::text),1,10),
  charter_md text,
  gov_type text NOT NULL DEFAULT 'democracy' CHECK (gov_type IN ('democracy','council','monarchy')),
  founder_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view societies" ON public.societies FOR SELECT USING (true);
CREATE POLICY "Auth can found societies" ON public.societies FOR INSERT WITH CHECK (auth.uid() = founder_id);
CREATE POLICY "Founders update society" ON public.societies FOR UPDATE USING (auth.uid() = founder_id);

CREATE TABLE IF NOT EXISTS public.society_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('founder','council','citizen')),
  voting_power integer NOT NULL DEFAULT 1,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (society_id, user_id)
);
ALTER TABLE public.society_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view society members" ON public.society_members FOR SELECT USING (true);
CREATE POLICY "Users join via invite" ON public.society_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave society" ON public.society_members FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_society_member(_user uuid, _society uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.society_members WHERE user_id = _user AND society_id = _society)
$$;

CREATE TABLE IF NOT EXISTS public.society_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id uuid NOT NULL,
  author_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','passed','rejected','expired')),
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.society_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view proposals" ON public.society_proposals FOR SELECT USING (is_society_member(auth.uid(), society_id));
CREATE POLICY "Members create proposals" ON public.society_proposals FOR INSERT WITH CHECK (is_society_member(auth.uid(), society_id) AND auth.uid() = author_id);

CREATE TABLE IF NOT EXISTS public.society_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL,
  voter_id uuid NOT NULL,
  vote text NOT NULL CHECK (vote IN ('yes','no','abstain')),
  weight integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proposal_id, voter_id)
);
ALTER TABLE public.society_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view vote tallies" ON public.society_votes FOR SELECT USING (true);
CREATE POLICY "Members vote" ON public.society_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- ============================================================
-- CHAT ROOMS (3 kinds: public / clan / society)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('public','clan','society')),
  parent_id uuid,
  owner_id uuid NOT NULL,
  stream_kind text NOT NULL DEFAULT 'text' CHECK (stream_kind IN ('text','audio','video')),
  is_live boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view chat rooms" ON public.chat_rooms FOR SELECT USING (true);
CREATE POLICY "Auth create chat rooms" ON public.chat_rooms FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update rooms" ON public.chat_rooms FOR UPDATE USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.chat_room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_room_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view room messages" ON public.chat_room_messages FOR SELECT USING (true);
CREATE POLICY "Auth post messages" ON public.chat_room_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authors delete own" ON public.chat_room_messages FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view reactions" ON public.message_reactions FOR SELECT USING (true);
CREATE POLICY "Users add reactions" ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own reactions" ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- HASHTAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag text NOT NULL UNIQUE,
  use_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view hashtags" ON public.hashtags FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.post_hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  hashtag_id uuid NOT NULL,
  UNIQUE (post_id, hashtag_id)
);
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view post hashtags" ON public.post_hashtags FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.extract_hashtags() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m text;
  v_tag_id uuid;
BEGIN
  IF NEW.content IS NULL THEN RETURN NEW; END IF;
  FOR m IN SELECT DISTINCT lower(substring(t FROM 2)) FROM regexp_matches(NEW.content, '#([A-Za-z0-9_]+)', 'g') AS r(t)
  LOOP
    INSERT INTO public.hashtags(tag) VALUES (m)
      ON CONFLICT (tag) DO UPDATE SET use_count = hashtags.use_count + 1
      RETURNING id INTO v_tag_id;
    INSERT INTO public.post_hashtags(post_id, hashtag_id) VALUES (NEW.id, v_tag_id) ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_extract_hashtags ON public.posts;
CREATE TRIGGER trg_extract_hashtags
  AFTER INSERT OR UPDATE OF content ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.extract_hashtags();

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('stream','post','short','comment','user','message')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporters see own" ON public.reports FOR SELECT USING (auth.uid() = reporter_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Auth submit reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins update" ON public.reports FOR UPDATE USING (has_role(auth.uid(),'admin'));

-- ============================================================
-- USER RANKINGS
-- ============================================================
CREATE OR REPLACE VIEW public.user_ranks AS
SELECT
  p.id AS user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  COALESCE((SELECT COUNT(*) FROM public.followers f WHERE f.following_id = p.id),0) AS follower_count,
  COALESCE((SELECT COUNT(*) FROM public.posts po WHERE po.user_id = p.id),0) AS post_count,
  COALESCE((SELECT SUM(coin_value) FROM public.gift_sends gs WHERE gs.recipient_id = p.id),0) AS gift_coins_received,
  COALESCE((SELECT AVG(stars) FROM public.ratings r WHERE r.target_id = p.id AND r.target_type = 'profile'),0) AS avg_rating,
  (
    COALESCE((SELECT COUNT(*) FROM public.followers f WHERE f.following_id = p.id),0) * 1
    + COALESCE((SELECT SUM(coin_value) FROM public.gift_sends gs WHERE gs.recipient_id = p.id),0) * 2
    + COALESCE((SELECT AVG(stars)*100 FROM public.ratings r WHERE r.target_id = p.id AND r.target_type = 'profile'),0)
    + COALESCE((SELECT COUNT(*) FROM public.posts po WHERE po.user_id = p.id),0) * 0.5
  )::numeric AS score
FROM public.profiles p;

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_war_gifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_sends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
