import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Video, Users, Settings, Eye, LogIn, ImagePlus, Trash2, Upload, X, Pencil, Camera, Mail } from 'lucide-react';
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
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);

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
    const { error } = await supabase.from('profiles').update({
      display_name: editName.trim(), username: editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''), bio: editBio.trim() || null,
    }).eq('id', user.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else {
      setProfile(prev => prev ? { ...prev, display_name: editName.trim(), username: editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''), bio: editBio.trim() || null } : prev);
      toast({ title: 'Profile updated!' }); setEditOpen(false);
    }
    setSaving(false);
  }

  if (authLoading || loading) return <AppLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div></AppLayout>;

  if (!user) return (
    <AppLayout><div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <Video className="w-16 h-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Your Channel</h1>
      <p className="text-muted-foreground text-center max-w-md mb-6">Sign in to manage your channel and see your content</p>
      <Link to="/auth"><Button><LogIn className="w-4 h-4 mr-2" />Sign In</Button></Link>
    </div></AppLayout>
  );

  const sections = [
    { icon: Video, label: 'Your streams', count: streams.length, link: `/channel/${profile?.username}` },
    { icon: Users, label: 'Sigmatized', count: followingCount, link: '/following' },
    { icon: Mail, label: 'Messages', count: 0, link: '/messages' },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-0 md:p-0 space-y-0">
        {/* Floating Avatar */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="fixed top-20 right-6 z-40 flex flex-col items-center gap-1.5">
          <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            <Avatar className="w-16 h-16 ring-3 ring-primary/30 shadow-lg shadow-primary/10">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-secondary text-lg font-bold">{profile?.display_name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"><ImagePlus className="w-5 h-5 text-white" /></div>
            {uploading && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"><div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" /></div>}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">You</span>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </motion.div>

        {/* Banner */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="relative w-full h-36 md:h-48 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary cursor-pointer group overflow-hidden rounded-b-2xl"
          onClick={() => bannerInputRef.current?.click()}>
          {profile?.banner_url ? <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" /> : (
            <div className="w-full h-full flex items-center justify-center"><div className="text-center"><Camera className="w-8 h-8 text-muted-foreground/40 mx-auto mb-1" /><p className="text-xs text-muted-foreground/50">Click to add a banner</p></div></div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-black/60 rounded-full px-4 py-2 flex items-center gap-2"><Camera className="w-4 h-4 text-white" /><span className="text-white text-sm font-medium">Change Banner</span></div>
          </div>
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
        </motion.div>

        <div className="px-6 md:px-8 space-y-8 pb-8">
          {/* Profile Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-5 -mt-10 relative z-10">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <Avatar className="w-20 h-20 ring-4 ring-background shadow-xl">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-secondary text-xl font-bold">{profile?.display_name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"><Camera className="w-5 h-5 text-white" /></div>
            </div>
            <div className="flex-1 pt-6">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{profile?.display_name || 'User'}</h1>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={openEditDialog}><Pencil className="w-3.5 h-3.5" /></Button>
              </div>
              <p className="text-sm text-muted-foreground">@{profile?.username || user.email?.split('@')[0]}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span><span className="font-semibold text-foreground">{followerCount}</span> Sigmatizers</span>
                <span><span className="font-semibold text-foreground">{followingCount}</span> Sigmatized</span>
              </div>
            </div>
            <Link to={`/channel/${profile?.username}`}><Button variant="secondary" size="sm" className="rounded-full"><Settings className="w-4 h-4 mr-2" />Manage</Button></Link>
          </motion.div>

          {/* Bio */}
          <div className="cursor-pointer group rounded-lg p-3 -mx-3 hover:bg-accent/20 transition-colors" onClick={openEditDialog}>
            {profile?.bio ? (
              <div className="flex items-start gap-2"><p className="text-sm text-muted-foreground max-w-xl flex-1">{profile.bio}</p><Pencil className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors mt-0.5 shrink-0" /></div>
            ) : <p className="text-sm text-muted-foreground/50 italic">Click to add a bio...</p>}
          </div>

          {/* Edit Profile Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><label className="text-sm font-medium text-foreground mb-1.5 block">Display Name</label><Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your display name" /></div>
                <div><label className="text-sm font-medium text-foreground mb-1.5 block">Username</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span><Input value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="username" className="pl-7" /></div><p className="text-xs text-muted-foreground mt-1">Only lowercase letters, numbers, and underscores</p></div>
                <div><label className="text-sm font-medium text-foreground mb-1.5 block">Bio</label><Textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell people about yourself..." rows={3} /></div>
                <Button onClick={handleSaveProfile} disabled={saving || !editName.trim() || !editUsername.trim()} className="w-full">{saving ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </DialogContent>
          </Dialog>

          <>
              {/* Quick Sections */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {sections.map((s, i) => (
                  <Link to={s.link} key={s.label}>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className="bg-card rounded-xl p-4 hover:bg-accent/30 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors"><s.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" /></div>
                        <div><p className="text-sm font-medium text-foreground">{s.label}</p><p className="text-xs text-muted-foreground">{s.count}</p></div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>

              {/* Gallery */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground">Gallery</h2>
                  <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                    <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setUploadOpen(true)}><ImagePlus className="w-4 h-4" />Upload</Button>
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
                  <div className="text-center py-12 bg-card rounded-xl"><ImagePlus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No images yet</p></div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {galleryImages.map(img => (
                      <motion.div key={img.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative group rounded-xl overflow-hidden aspect-square bg-secondary">
                        <img src={img.image_url} alt={img.caption || ''} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all">
                          <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-white hover:bg-white/20 h-7 w-7" onClick={() => handleDeleteImage(img.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                        {img.caption && <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent"><p className="text-white text-xs truncate">{img.caption}</p></div>}
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
          </>
        </div>
      </div>
    </AppLayout>
  );
}
