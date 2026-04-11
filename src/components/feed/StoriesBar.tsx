import { useState, useEffect, useRef } from 'react';
import { Plus, User, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface StoryUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  stories: { id: string; media_url: string; media_type: string; caption: string | null; created_at: string }[];
}

export function StoriesBar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [viewingUser, setViewingUser] = useState<StoryUser | null>(null);
  const [viewIndex, setViewIndex] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStories();
    const ch = supabase.channel('stories-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => fetchStories())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function fetchStories() {
    const { data } = await supabase
      .from('stories')
      .select('id, user_id, media_url, media_type, caption, created_at, expires_at')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!data) return;

    const userIds = [...new Set(data.map(s => s.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', userIds);

    const grouped: StoryUser[] = userIds.map(uid => {
      const p = profiles?.find(pr => pr.id === uid);
      return {
        user_id: uid,
        username: p?.username || 'user',
        display_name: p?.display_name || 'User',
        avatar_url: p?.avatar_url || null,
        stories: data.filter(s => s.user_id === uid),
      };
    });
    setStoryUsers(grouped);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('user-gallery').upload(path, file);
    if (upErr) { toast({ title: 'Upload failed', variant: 'destructive' }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('user-gallery').getPublicUrl(path);
    const mediaType = file.type.startsWith('video') ? 'video' : 'image';
    await supabase.from('stories').insert({
      user_id: user.id,
      media_url: urlData.publicUrl,
      media_type: mediaType,
      caption: caption.trim() || null,
    });
    setUploadOpen(false);
    setCaption('');
    setUploading(false);
    toast({ title: 'Story posted!' });
    fetchStories();
  }

  function openStory(su: StoryUser) {
    setViewingUser(su);
    setViewIndex(0);
  }

  function nextStory() {
    if (!viewingUser) return;
    if (viewIndex < viewingUser.stories.length - 1) {
      setViewIndex(i => i + 1);
    } else {
      setViewingUser(null);
    }
  }

  const currentStory = viewingUser?.stories[viewIndex];

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-3 px-1 scrollbar-hide">
        {/* Add Story */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
          onClick={() => user ? setUploadOpen(true) : null}
        >
          <div className="w-[64px] h-[64px] rounded-full bg-secondary p-[2px]">
            <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
              <Plus className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground w-16 text-center font-medium truncate">
            Your Story
          </span>
        </motion.div>

        {storyUsers.map((su, i) => (
          <motion.div
            key={su.user_id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (i + 1) * 0.05 }}
          >
            <button onClick={() => openStory(su)} className="flex flex-col items-center gap-1.5 shrink-0 group">
              <div className="w-[64px] h-[64px] rounded-full p-[3px] bg-gradient-to-br from-primary to-destructive group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full bg-card p-[2px]">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={su.avatar_url || ''} />
                    <AvatarFallback className="bg-secondary text-xs">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground truncate w-16 text-center group-hover:text-foreground transition-colors font-medium">
                {su.display_name}
              </span>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Story</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <input placeholder="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground outline-none" />
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}>
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Tap to select image or video</p>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
            </div>
            {uploading && <div className="flex items-center justify-center py-2"><div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Story Viewer */}
      <AnimatePresence>
        {viewingUser && currentStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            onClick={nextStory}
          >
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white z-10 h-9 w-9" onClick={(e) => { e.stopPropagation(); setViewingUser(null); }}>
              <X className="w-5 h-5" />
            </Button>
            {/* Progress bars */}
            <div className="absolute top-2 left-4 right-4 flex gap-1 z-10">
              {viewingUser.stories.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: i < viewIndex ? '100%' : '0%' }}
                    animate={{ width: i <= viewIndex ? '100%' : '0%' }}
                    transition={i === viewIndex ? { duration: 5 } : { duration: 0 }}
                  />
                </div>
              ))}
            </div>
            {/* User info */}
            <div className="absolute top-6 left-4 flex items-center gap-2 z-10">
              <Avatar className="w-8 h-8 ring-2 ring-white/30">
                <AvatarImage src={viewingUser.avatar_url || ''} />
                <AvatarFallback className="bg-secondary text-xs">{viewingUser.display_name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-white text-sm font-semibold">{viewingUser.display_name}</span>
            </div>
            {/* Media */}
            {currentStory.media_type === 'video' ? (
              <video src={currentStory.media_url} className="max-w-full max-h-full object-contain" autoPlay muted playsInline />
            ) : (
              <img src={currentStory.media_url} className="max-w-full max-h-full object-contain" alt="" />
            )}
            {currentStory.caption && (
              <div className="absolute bottom-8 left-4 right-4 text-center">
                <p className="text-white text-lg font-medium drop-shadow-lg">{currentStory.caption}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
