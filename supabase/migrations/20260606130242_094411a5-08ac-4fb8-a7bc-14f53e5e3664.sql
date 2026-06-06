ALTER TABLE public.clans
  ADD COLUMN IF NOT EXISTS tag text,
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS treasury_coins integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.clan_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL,
  invitee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','revoked','expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS clan_invites_pending_uk ON public.clan_invites (clan_id, invitee_id) WHERE status = 'pending';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clan_invites TO authenticated;
GRANT ALL ON public.clan_invites TO service_role;
ALTER TABLE public.clan_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own invites" ON public.clan_invites FOR SELECT TO authenticated
  USING (invitee_id = auth.uid() OR inviter_id = auth.uid() OR public.is_clan_member(auth.uid(), clan_id));
CREATE POLICY "clan members can invite" ON public.clan_invites FOR INSERT TO authenticated
  WITH CHECK (inviter_id = auth.uid() AND public.is_clan_member(auth.uid(), clan_id));
CREATE POLICY "invitee or inviter updates" ON public.clan_invites FOR UPDATE TO authenticated
  USING (invitee_id = auth.uid() OR inviter_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.clan_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clan_announcements TO authenticated;
GRANT ALL ON public.clan_announcements TO service_role;
ALTER TABLE public.clan_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read announcements" ON public.clan_announcements FOR SELECT TO authenticated
  USING (public.is_clan_member(auth.uid(), clan_id));
CREATE POLICY "members post announcements" ON public.clan_announcements FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.is_clan_member(auth.uid(), clan_id));
CREATE POLICY "authors edit own announcements" ON public.clan_announcements FOR UPDATE TO authenticated
  USING (author_id = auth.uid());
CREATE POLICY "authors delete own announcements" ON public.clan_announcements FOR DELETE TO authenticated
  USING (author_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.clan_war_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  war_id uuid NOT NULL REFERENCES public.clan_wars(id) ON DELETE CASCADE,
  round_no integer NOT NULL,
  ends_at timestamptz NOT NULL,
  winner_clan_id uuid,
  UNIQUE (war_id, round_no)
);
GRANT SELECT ON public.clan_war_rounds TO authenticated, anon;
GRANT ALL ON public.clan_war_rounds TO service_role;
ALTER TABLE public.clan_war_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clan war rounds are public" ON public.clan_war_rounds FOR SELECT USING (true);