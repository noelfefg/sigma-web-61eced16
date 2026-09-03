CREATE TABLE public.stream_metric_samples (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id uuid NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
  captured_at timestamp with time zone NOT NULL DEFAULT now(),
  viewer_count integer NOT NULL DEFAULT 0,
  chat_count integer NOT NULL DEFAULT 0,
  reaction_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT ON public.stream_metric_samples TO authenticated;
GRANT SELECT ON public.stream_metric_samples TO anon;
GRANT ALL ON public.stream_metric_samples TO service_role;
ALTER TABLE public.stream_metric_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Metric samples are viewable by everyone" ON public.stream_metric_samples FOR SELECT USING (true);
CREATE POLICY "Stream owner can record samples" ON public.stream_metric_samples FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.streams s WHERE s.id = stream_id AND s.user_id = auth.uid()));
CREATE INDEX idx_stream_metric_samples_stream_time ON public.stream_metric_samples (stream_id, captured_at);

CREATE TABLE public.stream_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id uuid NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  weight integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.stream_events TO authenticated;
GRANT SELECT ON public.stream_events TO anon;
GRANT ALL ON public.stream_events TO service_role;
ALTER TABLE public.stream_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stream events are viewable by everyone" ON public.stream_events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can log their own stream events" ON public.stream_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_stream_events_stream_time ON public.stream_events (stream_id, created_at);

CREATE TABLE public.user_interests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest text NOT NULL,
  source text NOT NULL DEFAULT 'onboarding',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, interest)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_interests TO authenticated;
GRANT ALL ON public.user_interests TO service_role;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own interests" ON public.user_interests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add their own interests" ON public.user_interests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own interests" ON public.user_interests FOR DELETE TO authenticated USING (auth.uid() = user_id);