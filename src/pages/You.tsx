import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Video, Heart, Clock, Settings, Eye, LogIn } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

export default function YouPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
        const [{ data: fc }, { data: fgc }, { data: streamsData }] = await Promise.all([
          supabase.rpc('get_follower_count', { profile_id: user.id }),
          supabase.rpc('get_following_count', { profile_id: user.id }),
          supabase.from('streams').select('id, title, viewer_count, thumbnail_url, is_live').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
        ]);
        setFollowerCount(fc || 0);
        setFollowingCount(fgc || 0);
        if (streamsData) setStreams(streamsData);
      }
      setLoading(false);
    }
    fetchData();
  }, [user]);

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

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-5"
        >
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
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </Link>
        </motion.div>

        {/* Bio */}
        {profile?.bio && (
          <p className="text-sm text-muted-foreground max-w-xl">{profile.bio}</p>
        )}

        {/* Quick Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sections.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-xl p-4 hover:bg-accent/30 transition-colors cursor-pointer group"
            >
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

        {/* Your Videos */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">Your Videos</h2>
          {streams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {streams.map((stream, i) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-card rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="relative aspect-video">
                    {stream.thumbnail_url ? (
                      <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                        <Video className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {stream.is_live && (
                      <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-md">LIVE</div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-foreground truncate">{stream.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Eye className="w-3 h-3" />
                      {stream.viewer_count} views
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
              <Link to="/go-live">
                <Button size="sm">Go Live</Button>
              </Link>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
