import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Video, Heart, Clock, Settings, Eye, LogIn, ImagePlus, Trash2, Upload, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
}

interface StreamData {
  id: string;
  title: string;
  viewer_count: number;
  thumbnail_url: string | null;
  is_live: boolean;
}

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

export default function YouPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) { setLoading(false); return; }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
        const [{ data: fc }, { data: fgc }, { data: streamsData }, { data: gallery }] = await Promise.all([
          supabase.rpc('get_follower_count', { profile_id: user.id }),
          supabase.rpc('get_following_count', { profile_id: user.id }),
          supabase.from('streams').select('id, title, viewer_count, thumbnail_url, is_live').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
          supabase.from('user_gallery').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        ]);
        setFollowerCount(fc || 0);
        setFollowingCount(fgc || 0);
        if (streamsData) setStreams(streamsData);
        if (gallery) setGalleryImages(gallery);
      }
      setLoading(false);
    }
    fetchData();
  }, [user]);

  function handleFileSelect(file: File | null) {
    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  async function handleUploadImage() {
    if (!user || !selectedFile) return;
    setUploading(true);

    const ext = selectedFile.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('user-gallery').upload(path, selectedFile);

    if (uploadErr) {
      toast({ title: 'Upload failed', description: uploadErr.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('user-gallery').getPublicUrl(path);
    const { error: insertErr } = await supabase.from('user_gallery').insert({
      user_id: user.id,
      image_url: urlData.publicUrl,
      caption: caption.trim() || null,
    });

    if (insertErr) {
      toast({ title: 'Error', description: insertErr.message, variant: 'destructive' });
    } else {
      toast({ title: 'Image uploaded!' });
      setUploadOpen(false);
      setCaption('');
      setSelectedFile(null);
      setPreviewUrl(null);
      // Refresh gallery
      const { data: gallery } = await supabase.from('user_gallery').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (gallery) setGalleryImages(gallery);
    }
    setUploading(false);
  }

  async function handleDeleteImage(id: string) {
    await supabase.from('user_gallery').delete().eq('id', id);
    setGalleryImages(prev => prev.filter(img => img.id !== id));
    toast({ title: 'Image deleted' });
  }

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
          <User className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Your Channel</h1>
          <p className="text-muted-foreground text-center max-w-md mb-6">Sign in to manage your channel and see your content</p>
          <Link to="/auth">
            <Button><LogIn className="w-4 h-4 mr-2" />Sign In</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const sections = [
    { icon: Video, label: 'Your videos', count: streams.length },
    { icon: Heart, label: 'Liked videos', count: 0 },
    { icon: Clock, label: 'Watch history', count: 0 },
  ];

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) {
      toast({ title: 'Upload failed', description: upErr.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', user.id);
    setProfile(prev => prev ? { ...prev, avatar_url: newUrl } : prev);
    toast({ title: 'Profile picture updated!' });
    setUploading(false);
  }


  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8 relative">
        {/* Floating Profile Picture - Top Right */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-20 right-6 z-40 flex flex-col items-center gap-1.5"
        >
          <div
            className="relative group cursor-pointer"
            onClick={() => avatarInputRef.current?.click()}
          >
            <Avatar className="w-16 h-16 ring-3 ring-primary/30 shadow-lg shadow-primary/10">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-secondary text-lg font-bold">
                {profile?.display_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <ImagePlus className="w-5 h-5 text-white" />
            </div>
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">You</span>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </motion.div>

        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-5">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-secondary text-xl font-bold">
              {profile?.display_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{profile?.display_name || 'User'}</h1>
            <p className="text-sm text-muted-foreground">@{profile?.username || user.email?.split('@')[0]}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span><span className="font-semibold text-foreground">{followerCount}</span> followers</span>
              <span><span className="font-semibold text-foreground">{followingCount}</span> following</span>
            </div>
          </div>
          <Link to={`/channel/${profile?.username}`}>
            <Button variant="secondary" size="sm" className="rounded-full">
              <Settings className="w-4 h-4 mr-2" />Manage
            </Button>
          </Link>
        </motion.div>

        {profile?.bio && <p className="text-sm text-muted-foreground max-w-xl">{profile.bio}</p>}

        {/* Quick Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sections.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-card rounded-xl p-4 hover:bg-accent/30 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <s.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.count} items</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Gallery Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Your Gallery</h2>
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="rounded-full">
                  <ImagePlus className="w-4 h-4 mr-2" />Upload Image
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Image</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <div className="relative">
                        <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                        <Button variant="ghost" size="icon" className="absolute top-0 right-0" onClick={e => { e.stopPropagation(); handleFileSelect(null); }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Click to select an image</p>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e.target.files?.[0] || null)} />
                  </div>
                  <Input placeholder="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)} />
                  <Button onClick={handleUploadImage} disabled={!selectedFile || uploading} className="w-full">
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {galleryImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {galleryImages.map((img, i) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative group rounded-xl overflow-hidden bg-card aspect-square"
                >
                  <img src={img.image_url} alt={img.caption || ''} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-2 opacity-0 group-hover:opacity-100">
                    {img.caption && <p className="text-white text-xs truncate flex-1">{img.caption}</p>}
                    <Button variant="ghost" size="icon" className="text-white/80 hover:text-white h-7 w-7" onClick={() => handleDeleteImage(img.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-card rounded-xl">
              <ImagePlus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-foreground mb-1">No images yet</h3>
              <p className="text-sm text-muted-foreground">Upload images to your gallery</p>
            </div>
          )}
        </section>

        {/* Your Videos */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">Your Videos</h2>
          {streams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {streams.map((stream, i) => (
                <motion.div key={stream.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-card rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer group">
                  <div className="relative aspect-video">
                    {stream.thumbnail_url ? (
                      <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                        <Video className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {stream.is_live && <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-md">LIVE</div>}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-foreground truncate">{stream.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Eye className="w-3 h-3" />{stream.viewer_count} views
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-foreground mb-1">No videos yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Start streaming to create your first video</p>
              <Link to="/go-live"><Button size="sm">Go Live</Button></Link>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
