import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, User } from 'lucide-react';

interface ProfileData {
  id: string; username: string; display_name: string; avatar_url: string | null; banner_url: string | null; bio: string | null; created_at: string;
}

interface PostData {
  id: string; content: string | null; created_at: string; media_urls: string[] | null;
}

export default function ProfilePage() {
  const { handle } = useParams();
  const { user } = useAuth();
  const safeHandle = (handle ?? '').replace(/^@/, '');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: p } = await supabase.from('profiles').select('*').eq('username', safeHandle).maybeSingle();
      if (!p) { setLoading(false); return; }
      setProfile(p);
      const [{ data: fc }, { data: postsData }] = await Promise.all([
        supabase.rpc('get_follower_count', { profile_id: p.id }),
        supabase.from('posts').select('id, content, created_at, media_urls').eq('user_id', p.id).order('created_at', { ascending: false }).limit(20),
      ]);
      setFollowerCount(fc || 0);
      if (postsData) setPosts(postsData);
      if (user) {
        const { data: f } = await supabase.rpc('is_following', { follower: user.id, following: p.id });
        setIsFollowing(!!f);
      }
      setLoading(false);
    }
    fetch();
  }, [safeHandle, user]);

  const handleFollow = async () => {
    if (!user || !profile) return;
    if (isFollowing) {
      await supabase.from('followers').delete().eq('follower_id', user.id).eq('following_id', profile.id);
      setIsFollowing(false); setFollowerCount(p => p - 1);
    } else {
      await supabase.from('followers').insert({ follower_id: user.id, following_id: profile.id });
      setIsFollowing(true); setFollowerCount(p => p + 1);
    }
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AppLayout>;
  if (!profile) return <AppLayout><div className="flex flex-col items-center justify-center min-h-[60vh]"><User className="w-16 h-16 text-muted-foreground mb-4" /><h1 className="text-xl font-bold">User not found</h1></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Banner */}
        <div className="aspect-[3/1] w-full overflow-hidden bg-secondary">
          {profile.banner_url && <img src={profile.banner_url} alt="Banner" className="h-full w-full object-cover" />}
        </div>
        <div className="px-4">
          <div className="-mt-10 flex items-end justify-between gap-4">
            <Avatar className="h-20 w-20 border-4 border-background">
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback className="text-xl bg-secondary">{profile.display_name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Button variant={isFollowing ? 'secondary' : 'default'} size="sm" onClick={handleFollow} disabled={!user || user.id === profile.id}>
              {isFollowing ? '✓ Sigmatized' : '+ Sigmatize'}
            </Button>
          </div>
          <div className="py-3">
            <h1 className="text-lg font-bold">{profile.display_name}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
            <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
              <span><span className="font-semibold text-foreground">{followerCount}</span> Sigmatizers</span>
            </div>
          </div>
        </div>

        <div className="px-4 pb-6">
          <Tabs defaultValue="posts">
            <TabsList className="w-full justify-between bg-secondary/50">
              <TabsTrigger value="posts" className="flex-1 text-xs">Posts</TabsTrigger>
              <TabsTrigger value="media" className="flex-1 text-xs">Media</TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="mt-4 space-y-3">
              {posts.length > 0 ? posts.map((p) => (
                <div key={p.id} className="bg-card rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile.avatar_url || ''} />
                      <AvatarFallback className="text-xs bg-secondary">{profile.display_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="text-sm font-semibold">{profile.display_name}</span><span className="text-xs text-muted-foreground">@{profile.username}</span></div>
                      {p.content && <p className="mt-1 text-sm">{p.content}</p>}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-sm text-muted-foreground">No posts yet</div>
              )}
            </TabsContent>
            <TabsContent value="media" className="mt-4">
              <div className="text-center py-8 text-sm text-muted-foreground">No media yet</div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
