import { useState, useEffect, useRef } from 'react';
import { Play, Heart, MessageSquare, Share2, Plus, Upload, X, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Short {
  id: string;
  title: string | null;
  video_url: string;
  thumbnail_url: string | null;
  view_count: number;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export default function ShortsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shorts, setShorts] = useState<Short[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  useEffect(() => {
    fetchShorts();
  }, []);

  async function fetchShorts() {
    setLoading(true);
    const { data } = await supabase
      .from('shorts')
      .select('*, profiles!shorts_user_id_fkey(username, display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setShorts(data as unknown as Short[]);
    setLoading(false);
  }

  async function handleUpload() {
    if (!user || !videoFile) return;
    setUploading(true);

    const ext = videoFile.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('clips').upload(path, videoFile);
    if (uploadErr) {
      toast({ title: 'Upload failed', description: uploadErr.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('clips').getPublicUrl(path);
    const { error: insertErr } = await supabase.from('shorts').insert({
      user_id: user.id,
      title: title || null,
      video_url: urlData.publicUrl,
    });

    if (insertErr) {
      toast({ title: 'Error', description: insertErr.message, variant: 'destructive' });
    } else {
      toast({ title: 'Short posted!' });
      setUploadOpen(false);
      setTitle('');
      setVideoFile(null);
      fetchShorts();
    }
    setUploading(false);
  }

  const goNext = () => setCurrentIndex(i => Math.min(i + 1, shorts.length - 1));
  const goPrev = () => setCurrentIndex(i => Math.max(i - 1, 0));

  const currentShort = shorts[currentIndex];

  return (
    <AppLayout>
      <div className="relative h-[calc(100vh-3.5rem)] flex items-center justify-center bg-background overflow-hidden">
        {/* Upload Button */}
        {user && (
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button className="absolute top-4 right-4 z-20 rounded-full" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Post Lil Vid
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Post a Lil Vid</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} />
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 text-center">
                  {videoFile ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground truncate">{videoFile.name}</span>
                      <Button variant="ghost" size="icon" onClick={() => setVideoFile(null)}><X className="w-4 h-4" /></Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to select video</p>
                      <input type="file" accept="video/*" className="hidden" onChange={e => setVideoFile(e.target.files?.[0] || null)} />
                    </label>
                  )}
                </div>
                <Button onClick={handleUpload} disabled={!videoFile || uploading} className="w-full">
                  {uploading ? 'Uploading...' : 'Post'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {loading ? (
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : shorts.length === 0 ? (
          <div className="text-center">
            <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">No lil vids yet</h2>
            <p className="text-muted-foreground mb-4">Be the first to post a lil vid!</p>
            {user && (
              <Button onClick={() => setUploadOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />Post a Lil Vid
              </Button>
            )}
          </div>
        ) : (
          <div className="relative w-full max-w-sm h-full flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentShort?.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="relative w-full aspect-[9/16] max-h-[80vh] bg-card rounded-2xl overflow-hidden"
              >
                <video
                  src={currentShort?.video_url}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                {/* Overlay Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={currentShort?.profiles?.avatar_url || ''} />
                      <AvatarFallback className="bg-secondary text-xs">{currentShort?.profiles?.display_name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-white text-sm font-medium">{currentShort?.profiles?.display_name || 'User'}</span>
                  </div>
                  {currentShort?.title && <p className="text-white text-sm">{currentShort.title}</p>}
                  <div className="flex items-center gap-1 text-white/60 text-xs mt-1">
                    <Eye className="w-3 h-3" /> {currentShort?.view_count} views
                  </div>
                </div>

                {/* Side Actions */}
                <div className="absolute right-3 bottom-24 flex flex-col gap-4">
                  <button className="flex flex-col items-center text-white/80 hover:text-white transition-colors">
                    <Heart className="w-7 h-7" />
                    <span className="text-xs mt-1">Like</span>
                  </button>
                  <button className="flex flex-col items-center text-white/80 hover:text-white transition-colors">
                    <MessageSquare className="w-7 h-7" />
                    <span className="text-xs mt-1">Comment</span>
                  </button>
                  <button className="flex flex-col items-center text-white/80 hover:text-white transition-colors">
                    <Share2 className="w-7 h-7" />
                    <span className="text-xs mt-1">Share</span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="absolute right-[-60px] top-1/2 -translate-y-1/2 flex flex-col gap-2">
              <Button variant="ghost" size="icon" onClick={goPrev} disabled={currentIndex === 0} className="rounded-full bg-card/50 backdrop-blur-sm">
                <ChevronUp className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={goNext} disabled={currentIndex === shorts.length - 1} className="rounded-full bg-card/50 backdrop-blur-sm">
                <ChevronDown className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
