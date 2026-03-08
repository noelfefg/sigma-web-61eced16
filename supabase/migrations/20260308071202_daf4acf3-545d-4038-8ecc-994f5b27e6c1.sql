
-- Create videos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);

-- Allow anyone to view videos
CREATE POLICY "Anyone can view videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.uid() IS NOT NULL);

-- Allow users to delete their own videos
CREATE POLICY "Users can delete own videos" ON storage.objects FOR DELETE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);
