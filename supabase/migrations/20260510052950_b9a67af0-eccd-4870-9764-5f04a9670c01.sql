ALTER TABLE public.streams
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'hls',
  ADD COLUMN IF NOT EXISTS source_url text;

ALTER TABLE public.streams
  DROP CONSTRAINT IF EXISTS streams_source_type_check;
ALTER TABLE public.streams
  ADD CONSTRAINT streams_source_type_check CHECK (source_type IN ('youtube','hls'));