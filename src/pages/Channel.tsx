import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Heart, 
  Share2, 
  Users,
  Calendar,
  Play,
  Eye,
  Clock,
  Video,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  created_at: string;
}

interface StreamData {
  id: string;
  title: string;
  viewer_count: number;
  thumbnail_url: string | null;
  is_live: boolean;
  categories: {
    name: string;
  } | null;
}

interface ClipData {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: number;
  view_count: number;
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export default function ChannelPage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [liveStream, setLiveStream] = useState<StreamData | null>(null);
  const [pastStreams, setPastStreams] = useState<StreamData[]>([]);
  const [clips, setClips] = useState<ClipData[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChannelData() {
      if (!username) return;

      setLoading(true);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (!profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const [{ data: followers }, { data: following }] = await Promise.all([
        supabase.rpc('get_follower_count', { profile_id: profileData.id }),
        supabase.rpc('get_following_count', { profile_id: profileData.id }),
      ]);

      setFollowerCount(followers || 0);
      setFollowingCount(following || 0);

      if (user) {
        const { data: isFollowingData } = await supabase.rpc('is_following', {
          follower: user.id,
          following: profileData.id,
        });
        setIsFollowing(!!isFollowingData);
      }

      const { data: liveData } = await supabase
        .from('streams')
        .select(`
          id,
          title,
          viewer_count,
          thumbnail_url,
          is_live,
          categories(name)
        `)
        .eq('user_id', profileData.id)
        .eq('is_live', true)
        .maybeSingle();

      setLiveStream(liveData as StreamData | null);

      const { data: pastData } = await supabase
        .from('streams')
        .select(`
          id,
          title,
          viewer_count,
          thumbnail_url,
          is_live,
          categories(name)
        `)
        .eq('user_id', profileData.id)
        .eq('is_live', false)
        .order('ended_at', { ascending: false })
        .limit(6);

      setPastStreams((pastData as StreamData[]) || []);

      const { data: clipsData } = await supabase
        .from('clips')
        .select('id, title, thumbnail_url, duration, view_count')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false })
        .limit(6);

      setClips(clipsData || []);

      setLoading(false);
    }

    fetchChannelData();
  }, [username, user]);

  const handleFollow = async () => {
    if (!user || !profile) return;

    if (isFollowing) {
      await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);
      setIsFollowing(false);
      setFollowerCount((prev) => prev - 1);
    } else {
      await supabase.from('followers').insert({
        follower_id: user.id,
        following_id: profile.id,
      });
      setIsFollowing(true);
      setFollowerCount((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Users className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Channel not found</h1>
          <p className="text-muted-foreground">This user doesn't exist</p>
        </div>
      </AppLayout>
    );
  }

  const joinedDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <AppLayout>
      <div className="min-h-full">
        {/* Banner */}
        <motion.div 
          className="relative h-48 md:h-64 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {profile.banner_url ? (
            <img
              src={profile.banner_url}
              alt="Channel banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </motion.div>

        {/* Profile Section */}
        <motion.div 
          className="relative px-4 md:px-6 -mt-16"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Avatar */}
            <motion.div className="relative" variants={cardItem}>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background object-cover shadow-xl shadow-primary/10"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background bg-primary/20 flex items-center justify-center shadow-xl shadow-primary/10">
                  <span className="text-4xl font-bold text-primary">
                    {profile.display_name[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              {liveStream && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow-lg shadow-destructive/30">
                  LIVE
                </div>
              )}
            </motion.div>

            {/* Info */}
            <motion.div className="flex-1" variants={cardItem}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{profile.display_name}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {formatCount(followerCount)} Sigmatizers
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {joinedDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isFollowing ? 'secondary' : 'default'}
                    onClick={handleFollow}
                    disabled={!user || user.id === profile.id}
                    className={`rounded-full px-6 ${isFollowing ? '' : 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20'}`}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isFollowing ? 'fill-current text-destructive' : ''}`} />
                    {isFollowing ? 'Sigmatized' : 'Sigmatize'}
                  </Button>
                  <Button variant="secondary" className="rounded-full">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {profile.bio && (
                <p className="text-muted-foreground mt-3 max-w-2xl">{profile.bio}</p>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Live Stream Preview */}
        {liveStream && (
          <motion.div 
            className="px-4 md:px-6 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Link to={`/watch/${profile.username}`}>
              <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group">
                <div className="aspect-video bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                  {liveStream.thumbnail_url ? (
                    <img
                      src={liveStream.thumbnail_url}
                      alt={liveStream.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/30 transition-colors">
                        <Play className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-muted-foreground mt-2">Click to watch live</p>
                    </div>
                  )}
                </div>
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="bg-destructive text-destructive-foreground text-sm font-bold px-3 py-1 rounded-full shadow-lg shadow-destructive/30">
                    LIVE
                  </div>
                  <div className="bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {formatCount(liveStream.viewer_count)}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground">{liveStream.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {liveStream.categories?.name || 'Uncategorized'}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Content Tabs */}
        <motion.div 
          className="px-4 md:px-6 mt-6 pb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="bg-secondary/60 backdrop-blur-sm rounded-full p-1">
              <TabsTrigger value="videos" className="rounded-full">Videos</TabsTrigger>
              <TabsTrigger value="clips" className="rounded-full">Clips</TabsTrigger>
              <TabsTrigger value="about" className="rounded-full">About</TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="mt-6">
              {pastStreams.length > 0 ? (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                >
                  {pastStreams.map((stream) => (
                    <motion.div
                      key={stream.id}
                      variants={cardItem}
                      className="bg-card/80 backdrop-blur-xl rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="relative aspect-video">
                        {stream.thumbnail_url ? (
                          <img
                            src={stream.thumbnail_url}
                            alt={stream.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center">
                            <Video className="w-8 h-8 text-primary/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-12 h-12 text-white drop-shadow-lg" />
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-foreground truncate">{stream.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {formatCount(stream.viewer_count)} views
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No videos yet</h3>
                  <p className="text-muted-foreground">Past streams will appear here</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="clips" className="mt-6">
              {clips.length > 0 ? (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                >
                  {clips.map((clip) => (
                    <motion.div
                      key={clip.id}
                      variants={cardItem}
                      className="bg-card/80 backdrop-blur-xl rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="relative aspect-video">
                        {clip.thumbnail_url ? (
                          <img
                            src={clip.thumbnail_url}
                            alt={clip.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center">
                            <Video className="w-8 h-8 text-primary/30" />
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                          {formatDuration(clip.duration)}
                        </div>
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-12 h-12 text-white drop-shadow-lg" />
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-foreground truncate">{clip.title}</h3>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Eye className="w-3 h-3 mr-1" />
                          {formatCount(clip.view_count)} views
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No clips yet</h3>
                  <p className="text-muted-foreground">Clips from this channel will appear here</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="about" className="mt-6">
              <motion.div 
                className="max-w-2xl"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">About {profile.display_name}</h3>
                    <p className="text-muted-foreground">{profile.bio || 'No bio yet.'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Sigmatizers</p>
                      <p className="text-xl font-bold text-foreground">{formatCount(followerCount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sigmatized</p>
                      <p className="text-xl font-bold text-foreground">{formatCount(followingCount)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </AppLayout>
  );
}
