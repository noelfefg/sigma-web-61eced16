
-- Storage bucket for user gallery images
INSERT INTO storage.buckets (id, name, public) VALUES ('user-gallery', 'user-gallery', true);

-- RLS for user-gallery bucket
CREATE POLICY "Anyone can view gallery images" ON storage.objects FOR SELECT USING (bucket_id = 'user-gallery');
CREATE POLICY "Users can upload gallery images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own gallery images" ON storage.objects FOR DELETE USING (bucket_id = 'user-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Communities table
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  banner_url TEXT,
  creator_id UUID NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view communities" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create communities" ON public.communities FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update communities" ON public.communities FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete communities" ON public.communities FOR DELETE USING (auth.uid() = creator_id);

-- Community members table
CREATE TABLE public.community_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view members" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "Users can join communities" ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave communities" ON public.community_members FOR DELETE USING (auth.uid() = user_id);

-- Shorts table
CREATE TABLE public.shorts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shorts" ON public.shorts FOR SELECT USING (true);
CREATE POLICY "Users can create shorts" ON public.shorts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shorts" ON public.shorts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shorts" ON public.shorts FOR DELETE USING (auth.uid() = user_id);

-- User gallery images table
CREATE TABLE public.user_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gallery" ON public.user_gallery FOR SELECT USING (true);
CREATE POLICY "Users can upload to gallery" ON public.user_gallery FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own gallery images" ON public.user_gallery FOR DELETE USING (auth.uid() = user_id);
