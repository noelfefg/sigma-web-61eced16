import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Video, Heart, Clock, Settings, LogIn, ImagePlus, Trash2, Upload, X, Pencil, Camera, BarChart3, Radio, Share2, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { CreatorAnalytics } from '@/components/analytics/CreatorAnalytics';

interface ProfileData { id: string; username: string; display_name: string; avatar_url: string | null; banner_url: string | null; bio: string | null; }
interface StreamData { id: string; title: string; viewer_count: number; thumbnail_url: string | null; is_live: boolean; }
interface GalleryImage { id: string; image_url: string; caption: string | null; created_at: string; }

type YouTab = 'overview' | 'analytics';

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
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<YouTab>('overview');

  useEffect(() => {
    async function fetchData() {
      if (!user) { setLoading(false); return; }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (profileData) {
        setProfile(profileData);
        const [{ data: fc }, { data: fgc }, { data: streamsData }, { data: gallery }] = await Promise.all([
          supabase.rpc('get_follower_count', { profile_id: user.id }),
          supabase.rpc('get_following_count', { profile_id: user.id }),
          supabase.from('streams').select('id, title, viewer_count, thumbnail_url, is_live').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
          supabase.from('user_gallery').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        ]);
        setFollowerCount(fc || 0); setFollowingCount(fgc || 0);
        if (streamsData) setStreams(streamsData);
        if (gallery) setGalleryImages(gallery);
      }
      setLoading(false);
    }
    fetchData();
  }, [user]);

  function handleFileSelect(file: File | null) {
    setSelectedFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleUploadImage() {
    if (!user || !selectedFile) return;
    setUploading(true);
    const ext = selectedFile.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('user-gallery').upload(path, selectedFile);
    if (uploadErr) { toast({ title: 'Upload failed', description: uploadErr.message, variant: 'destructive' }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('user-gallery').getPublicUrl(path);
    const { error: insertErr } = await supabase.from('user_gallery').insert({ user_id: user.id, image_url: urlData.publicUrl, caption: caption.trim() || null });
    if (insertErr) { toast({ title: 'Error', description: insertErr.message, variant: 'destructive' }); }
    else {
      toast({ title: 'Image uploaded!' }); setUploadOpen(false); setCaption(''); setSelectedFile(null); setPreviewUrl(null);
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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) { toast({ title: 'Upload failed', description: upErr.message, variant: 'destructive' }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', user.id);
    setProfile(prev => prev ? { ...prev, avatar_url: newUrl } : prev);
    toast({ title: 'Profile picture updated!' }); setUploading(false);
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/banner.${ext}`;
    const { error: upErr } = await supabase.storage.from('banners').upload(path, file, { upsert: true });
    if (upErr) { toast({ title: 'Upload failed', description: upErr.message, variant: 'destructive' }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('banners').getPublicUrl(path);
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from('profiles').update({ banner_url: newUrl }).eq('id', user.id);
    setProfile(prev => prev ? { ...prev, banner_url: newUrl } : prev);
    toast({ title: 'Banner updated!' }); setUploading(false);
  }

  function openEditDialog() {
    if (profile) { setEditName(profile.display_name); setEditUsername(profile.username); setEditBio(profile.bio || ''); }
    setEditOpen(true);
  }

  async function handleSaveProfile() {
    if (!user || !editName.trim() || !editUsername.trim()) return;
    setSaving(true);
    const cleanUsername = editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const { error } = await supabase.from('profiles').update({
      display_name: editName.trim(), username: cleanUsername, bio: editBio.trim() || null,
    }).eq('id', user.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else {
      setProfile(prev => prev ? { ...prev, display_name: editName.trim(), username: cleanUsername, bio: editBio.trim() || null } : prev);
      toast({ title: 'Profile updated!' }); setEditOpen(false);
    }
    setSaving(false);
  }

  async function handleShare() {
    const url = `${window.location.origin}/profile/@${profile?.username}`;
    if (navigator.share) { try { await navigator.share({ title: profile?.display_name, url }); } catch {} }
    else { await navigator.clipboard.writeText(url); toast({ title: 'Profile link copied!' }); }
  }

  if (authLoading || loading) return <AppLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AppLayout>;

  if (!user) return (
    <AppLayout><div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <User className="w-16 h-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Your Channel</h1>
      <p className="text-muted-foreground text-center max-w-md mb-6">Sign in to manage your channel and see your content</p>
      <Link to="/auth"><Button><LogIn className="w-4 h-4 mr-2" />Sign In</Button></Link>
    </div></AppLayout>
  );

  const stats = [
    { label: 'Followers', value: followerCount },
    { label: 'Following', value: followingCount },
    { label: 'Streams', value: streams.length },
    { label: 'Posts', value: galleryImages.length },
  ];

  const sections = [
    { icon: Video, label: 'Your videos', sub: `${streams.length} items`, link: `/channel/${profile?.username}` },
    { icon: Heart, label: 'Liked', sub: 'Posts you loved', link: '/feed' },
    { icon: Clock, label: 'History', sub: 'Watch history', link: '/browse' },
    { icon: BarChart3, label: 'Creator Studio', sub: 'Tools & insights', link: '/studio' },
  ];

  const youTabs = [
    { id: 'overview' as const, label: 'Overview', icon: User },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-8">
        {/* Banner */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="relative w-full h-32 sm:h-44 md:h-56 bg-gradient-to-br from-primary/30 via-accent/15 to-secondary cursor-pointer group overflow-hidden md:rounded-b-3xl"
          onClick={() => bannerInputRef.current?.click()}
        >
          {profile?.banner_url ? (
            <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center"><Camera className="w-7 h-7 text-muted-foreground/40 mx-auto mb-1" /><p className="text-xs text-muted-foreground/60">Tap to add a banner</p></div>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur rounded-full p-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
        </motion.div>

        {/* Identity row */}
        <div className="px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-4 -mt-12 sm:-mt-14 relative z-10">
            <div className="relative group cursor-pointer shrink-0" onClick={() => avatarInputRef.current?.click()}>
              <Avatar className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-background shadow-xl">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-secondary text-2xl font-bold">{profile?.display_name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Camera className="w-6 h-6 text-white" />
              </div>
              {uploading && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"><div className="w-6 h-6 animate-spin rounded-full border-2 border-white border-t-transparent" /></div>}
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{profile?.display_name || 'User'}</h1>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary shrink-0" onClick={openEditDialog}><Pencil className="w-3.5 h-3.5" /></Button>
              </div>
              <p className="text-sm text-muted-foreground truncate">@{profile?.username || user.email?.split('@')[0]}</p>
            </div>
          </motion.div>

          {/* Bio */}
          <div className="mt-3 cursor-pointer group rounded-lg p-2 -mx-2 hover:bg-accent/20 transition-colors" onClick={openEditDialog}>
            {profile?.bio ? (
              <p className="text-sm text-foreground/90 leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="text-sm text-muted-foreground/60 italic">Tap to add a bio…</p>
            )}
          </div>

          {/* Primary action bar — mobile full-width, desktop inline */}
          <div className="mt-4 grid grid-cols-3 gap-2 sm:flex sm:gap-2">
            <Link to="/go-live" className="contents sm:block">
              <Button className="w-full sm:w-auto rounded-full font-bold gap-1.5 h-11">
                <Radio className="w-4 h-4" />Go Live
              </Button>
            </Link>
            <Button variant="secondary" className="w-full sm:w-auto rounded-full gap-1.5 h-11" onClick={handleShare}>
              <Share2 className="w-4 h-4" />Share
            </Button>
            <Link to="/settings" className="contents sm:block">
              <Button variant="secondary" className="w-full sm:w-auto rounded-full gap-1.5 h-11">
                <Settings className="w-4 h-4" />Settings
              </Button>
            </Link>
          </div>

          {/* Stat strip */}
          <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
            {stats.map(s => (
              <div key={s.label} className="bg-card rounded-2xl py-3 px-2 text-center">
                <p className="text-base sm:text-lg font-bold text-foreground tabular-nums leading-tight">{s.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Sticky tab bar */}
          <div className="sticky top-14 z-20 -mx-4 sm:-mx-6 mt-5 px-4 sm:px-6 py-2 bg-background/95 backdrop-blur">
            <div className="flex bg-secondary/60 rounded-2xl p-1">
              {youTabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all ${activeTab === t.id ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
                  <t.icon className="w-4 h-4" />{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Edit Profile Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><label className="text-sm font-medium text-foreground mb-1.5 block">Display Name</label><Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your display name" /></div>
                <div><label className="text-sm font-medium text-foreground mb-1.5 block">Username</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span><Input value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="username" className="pl-7" /></div><p className="text-xs text-muted-foreground mt-1">Lowercase letters, numbers, and underscores</p></div>
                <div><label className="text-sm font-medium text-foreground mb-1.5 block">Bio</label><Textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell people about yourself..." rows={3} /></div>
                <Button onClick={handleSaveProfile} disabled={saving || !editName.trim() || !editUsername.trim()} className="w-full">{saving ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </DialogContent>
          </Dialog>

          {activeTab === 'analytics' ? (
            <div className="mt-4"><CreatorAnalytics /></div>
          ) : (
            <div className="mt-4 space-y-6">
              {/* Quick sections — list on mobile, grid on desktop */}
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">Library</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sections.map((s, i) => (
                    <Link to={s.link} key={s.label}>
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-card rounded-2xl p-3.5 hover:bg-accent/30 active:scale-[0.99] transition-all flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                          <s.icon className="w-5 h-5 text-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{s.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.sub}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Recent streams */}
              {streams.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Streams</h2>
                    <Link to={`/channel/${profile?.username}`} className="text-xs font-semibold text-primary">See all</Link>
                  </div>
                  <div className="flex gap-3 overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 pb-2 snap-x scrollbar-hide">
                    {streams.map(s => (
                      <Link to={`/watch/${s.id}`} key={s.id} className="snap-start shrink-0 w-44">
                        <div className="aspect-video bg-secondary rounded-xl overflow-hidden relative">
                          {s.thumbnail_url ? <img src={s.thumbnail_url} alt={s.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Video className="w-6 h-6 text-muted-foreground" /></div>}
                          {s.is_live && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">LIVE</span>}
                        </div>
                        <p className="text-xs font-medium text-foreground mt-1.5 line-clamp-2">{s.title}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Gallery */}
              <section>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gallery</h2>
                  <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                    <Button variant="ghost" size="sm" className="gap-1 text-primary h-7 px-2" onClick={() => setUploadOpen(true)}><ImagePlus className="w-3.5 h-3.5" />Upload</Button>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Upload Image</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <Input placeholder="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)} />
                        <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 text-center">
                          {selectedFile && previewUrl ? (
                            <div className="space-y-2"><img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg object-cover" /><Button variant="ghost" size="sm" onClick={() => handleFileSelect(null)}><X className="w-4 h-4 mr-1" />Remove</Button></div>
                          ) : (
                            <label className="cursor-pointer"><Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Click to select image</p><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e.target.files?.[0] || null)} /></label>
                          )}
                        </div>
                        <Button onClick={handleUploadImage} disabled={!selectedFile || uploading} className="w-full">{uploading ? 'Uploading...' : 'Upload'}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {galleryImages.length === 0 ? (
                  <div className="text-center py-10 bg-card rounded-2xl"><ImagePlus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No images yet</p></div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {galleryImages.map(img => (
                      <motion.div key={img.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative group rounded-lg overflow-hidden aspect-square bg-secondary">
                        <img src={img.image_url} alt={img.caption || ''} className="w-full h-full object-cover" />
                        <button onClick={() => handleDeleteImage(img.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur rounded-full p-1.5">
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
