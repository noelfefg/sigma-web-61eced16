
-- Conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Conversation participants
CREATE TABLE public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Direct messages
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

-- RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_member(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  );
$$;

-- Conversations: members can view
CREATE POLICY "Members can view conversations" ON public.conversations
  FOR SELECT USING (public.is_conversation_member(auth.uid(), id));

-- Conversations: authenticated can create
CREATE POLICY "Authenticated users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Participants: members can view
CREATE POLICY "Members can view participants" ON public.conversation_participants
  FOR SELECT USING (public.is_conversation_member(auth.uid(), conversation_id));

-- Participants: authenticated can add
CREATE POLICY "Authenticated users can add participants" ON public.conversation_participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Messages: members can view
CREATE POLICY "Members can view messages" ON public.direct_messages
  FOR SELECT USING (public.is_conversation_member(auth.uid(), conversation_id));

-- Messages: members can send
CREATE POLICY "Members can send messages" ON public.direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id AND public.is_conversation_member(auth.uid(), conversation_id));

-- Messages: sender can update (for read receipts)
CREATE POLICY "Recipients can mark read" ON public.direct_messages
  FOR UPDATE USING (public.is_conversation_member(auth.uid(), conversation_id));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
