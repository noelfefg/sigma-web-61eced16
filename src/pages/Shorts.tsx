import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Heart, MessageSquare, Share2, Plus, Upload, X, Eye, Music, User, Flag } from 'lucide-react';
import { ReportButton } from '@/components/shared/ReportButton';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';

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
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchShorts(); }, []);

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
    if (uploadErr) { toast({ title: 'Upload failed', description: uploadErr.message, variant: 'destructive' }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('clips').getPublicUrl(path);
    const { error: insertErr } = await supabase.from('shorts').insert({ user_id: user.id, title: title || null, video_url: urlData.publicUrl });
    if (insertErr) { toast({ title: 'Error', description: insertErr.message, variant: 'destructive' }); }
    else { toast({ title: 'Lil Vid posted!' }); setUploadOpen(false); setTitle(''); setVideoFile(null); fetchShorts(); }
    setUploading(false);
  }

  const goNext = useCallback(() => setCurrentIndex(i => Math.min(i + 1, shorts.length - 1)), [shorts.length]);
  const goPrev = useCallback(() => setCurrentIndex(i => Math.max(i - 1, 0)), []);

  const handleDoubleTap = (shortId: string) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked.has(shortId)) setLiked(prev => new Set([...prev, shortId]));
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 900);
    }
    lastTapRef.current = now;
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y < -50) goNext();
    else if (info.offset.y > 50) goPrev();
  };

  // Touch/wheel for swipe
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      const diff = startY - e.changedTouches[0].clientY;
      if (diff > 60) goNext();
      else if (diff < -60) goPrev();
    };
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 30) goNext();
      else if (e.deltaY < -30) goPrev();
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => { el.removeEventListener('touchstart', onTouchStart); el.removeEventListener('touchend', onTouchEnd); el.removeEventListener('wheel', onWheel); };
  }, [goNext, goPrev]);

  const currentShort = shorts[currentIndex];

  return (
    <AppLayout>
      <div ref={containerRef} className="relative h-[calc(100vh-3.5rem)] flex items-center justify-center bg-black overflow-hidden">
        {/* Upload Button */}
        {user && (
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button className="absolute top-4 right-4 z-20 rounded-full bg-white/10 backdrop-blur-sm border-0 hover:bg-white/20" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Post Lil Vid
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Post a Lil Vid</DialogTitle></DialogHeader>
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
                <Button onClick={handleUpload} disabled={!videoFile || uploading} className="w-full">{uploading ? 'Uploading...' : 'Post'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {loading ? (
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : shorts.length === 0 ? (
          <div className="text-center">
            <Play className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No lil vids yet</h2>
            <p className="text-white/60 mb-4">Be the first to post a lil vid!</p>
            {user && <Button onClick={() => setUploadOpen(true)} className="rounded-full"><Plus className="w-4 h-4 mr-2" />Post a Lil Vid</Button>}
          </div>
        ) : (
          <div className="relative w-full max-w-sm h-full flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentShort?.id}
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -100 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative w-full h-[85vh] max-h-[900px] bg-black rounded-2xl overflow-hidden"
                onClick={() => currentShort && handleDoubleTap(currentShort.id)}
              >
                <video
                  src={currentShort?.video_url}
                  className="w-full h-full object-cover"
                  autoPlay loop muted playsInline
                />

                {/* Double tap heart */}
                <AnimatePresence>
                  {showHeart && (
                    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Heart className="w-24 h-24 fill-white text-white drop-shadow-2xl" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom overlay */}
                <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-9 h-9 ring-2 ring-white/30">
                      <AvatarImage src={currentShort?.profiles?.avatar_url || ''} />
                      <AvatarFallback className="bg-white/20 text-white text-xs"><User className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                    <span className="text-white text-sm font-bold">{currentShort?.profiles?.display_name || 'User'}</span>
                    <button className="text-white text-xs font-bold border border-white/50 rounded-full px-3 py-0.5 hover:bg-white/10 transition-colors ml-1">Follow</button>
                  </div>
                  {currentShort?.title && <p className="text-white text-sm mb-2">{currentShort.title}</p>}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                      <Music className="w-3 h-3 text-white" />
                      <span className="text-white text-[11px]">Original Sound</span>
                    </div>
                  </div>
                </div>

                {/* Side Actions */}
                <div className="absolute right-3 bottom-20 flex flex-col gap-5">
                  <motion.button whileTap={{ scale: 0.8 }} className="flex flex-col items-center"
                    onClick={(e) => { e.stopPropagation(); if (currentShort) { setLiked(prev => { const n = new Set(prev); n.has(currentShort.id) ? n.delete(currentShort.id) : n.add(currentShort.id); return n; }); } }}>
                    <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <Heart className={`w-6 h-6 ${currentShort && liked.has(currentShort.id) ? 'fill-destructive text-destructive' : 'text-white'}`} />
                    </div>
                    <span className="text-white text-[10px] mt-1 font-medium">Like</span>
                  </motion.button>
                  <button className="flex flex-col items-center">
                    <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white text-[10px] mt-1 font-medium">Comment</span>
                  </button>
                  <button className="flex flex-col items-center">
                    <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <Share2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white text-[10px] mt-1 font-medium">Share</span>
                  </button>
                  <div className="flex flex-col items-center">
                    <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white text-[10px] mt-1 font-medium">{currentShort?.view_count || 0}</span>
                  </div>
                  {currentShort && (
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <ReportButton targetType="short" targetId={currentShort.id} variant="icon" className="text-white hover:bg-transparent h-6 w-6" />
                      </div>
                      <span className="text-white text-[10px] mt-1 font-medium">Report</span>
                    </div>
                  )}
                </div>

                {/* Progress dots */}
                <div className="absolute top-3 left-0 right-0 flex justify-center gap-1">
                  {shorts.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((s, i) => (
                    <div key={s.id} className={`h-0.5 rounded-full transition-all ${s.id === currentShort?.id ? 'w-6 bg-white' : 'w-2 bg-white/30'}`} />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
