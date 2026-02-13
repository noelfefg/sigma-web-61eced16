import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Zap, Users, Video, Sparkles, TrendingUp, Star } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Stream {
  id: string;
  title: string;
  viewer_count: number;
  thumbnail_url: string | null;
  category_id: string | null;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  categories: {
    name: string;
  } | null;
}

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

function formatViewerCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

export default function HomePage() {
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [recommendedChannels, setRecommendedChannels] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const { data: streams } = await supabase
        .from('streams')
        .select(`
          id, title, viewer_count, thumbnail_url, category_id,
          profiles!inner(username, display_name, avatar_url),
          categories(name)
        `)
        .eq('is_live', true)
        .order('viewer_count', { ascending: false })
        .limit(8);

      if (streams) setLiveStreams(streams as unknown as Stream[]);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .limit(6);

      if (profiles) setRecommendedChannels(profiles);
      setLoading(false);
    }
    fetchData();
  }, []);

  const featuredStream = liveStreams[0];
  const otherStreams = liveStreams.slice(1);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-8">
        {/* Featured Stream */}
        {loading ? (
          <Skeleton className="w-full aspect-[21/9] rounded-2xl" />
        ) : featuredStream ? (
          <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <Link to={`/watch/${featuredStream.profiles.username}`}>
              <div className="relative rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/40 transition-all duration-500 group shadow-xl hover:shadow-2xl hover:shadow-primary/10">
                <div className="aspect-[21/9] relative">
                  {featuredStream.thumbnail_url ? (
                    <img
                      src={featuredStream.thumbnail_url}
                      alt={featuredStream.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent to-secondary flex items-center justify-center">
                      <Video className="w-16 h-16 text-primary/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="bg-destructive text-destructive-foreground text-sm font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-white rounded-full" />
                      LIVE
                    </div>
                    <div className="bg-black/60 backdrop-blur-md text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatViewerCount(featuredStream.viewer_count)} watching
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-end gap-4">
                      {featuredStream.profiles.avatar_url ? (
                        <img
                          src={featuredStream.profiles.avatar_url}
                          alt={featuredStream.profiles.display_name}
                          className="w-16 h-16 rounded-full border-2 border-primary/50 object-cover ring-4 ring-primary/20"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full border-2 border-primary/50 bg-gradient-to-br from-primary/30 to-accent flex items-center justify-center ring-4 ring-primary/20">
                          <span className="text-2xl font-bold text-primary-foreground">
                            {featuredStream.profiles.display_name[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-white drop-shadow-lg">{featuredStream.title}</h2>
                        <p className="text-white/80">
                          {featuredStream.profiles.display_name} • {featuredStream.categories?.name || 'Uncategorized'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.section>
        ) : (
          <motion.section 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-gradient-to-br from-card to-accent/20 rounded-2xl border border-border/50 p-12 text-center shadow-lg"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No live streams yet</h2>
            <p className="text-muted-foreground">Be the first to go live!</p>
          </motion.section>
        )}

        {/* Live Channels */}
        {otherStreams.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Live Channels</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {otherStreams.map((stream, i) => (
                <motion.div key={stream.id} custom={i} variants={cardVariants} initial="hidden" animate="visible">
                  <Link to={`/watch/${stream.profiles.username}`} className="group block">
                    <div className="relative rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                      <div className="relative aspect-video">
                        {stream.thumbnail_url ? (
                          <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/15 via-accent/30 to-secondary flex items-center justify-center">
                            <Video className="w-8 h-8 text-primary/30" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          LIVE
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatViewerCount(stream.viewer_count)}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      
                      <div className="p-3">
                        <div className="flex gap-3">
                          {stream.profiles.avatar_url ? (
                            <img src={stream.profiles.avatar_url} alt={stream.profiles.display_name} className="w-10 h-10 rounded-full object-cover ring-2 ring-border" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">{stream.profiles.display_name[0]?.toUpperCase()}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">{stream.title}</h3>
                            <p className="text-sm text-muted-foreground truncate">{stream.profiles.display_name}</p>
                            <p className="text-xs text-muted-foreground">{stream.categories?.name || 'Uncategorized'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Recommended Channels */}
        {recommendedChannels.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Channels</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedChannels.map((channel, i) => (
                <motion.div key={channel.id} custom={i} variants={cardVariants} initial="hidden" animate="visible">
                  <Link
                    to={`/channel/${channel.username}`}
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border/50 hover:border-primary/40 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
                  >
                    <div className="relative">
                      {channel.avatar_url ? (
                        <img src={channel.avatar_url} alt={channel.display_name} className="w-12 h-12 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/30 transition-all" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center ring-2 ring-border group-hover:ring-primary/30 transition-all">
                          <span className="text-lg font-bold text-primary">{channel.display_name[0]?.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">{channel.display_name}</p>
                      <p className="text-sm text-muted-foreground truncate">@{channel.username}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Suggested for You */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 bg-gradient-to-br from-primary/20 to-accent/30 rounded-lg">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Live channels we think you'll like</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'ProGamer99', category: 'Fortnite', viewers: '4.2K', color: 'from-red-500 to-pink-500' },
              { name: 'ArtMaster', category: 'Art', viewers: '1.8K', color: 'from-purple-500 to-indigo-500' },
              { name: 'CodeStream', category: 'Software Dev', viewers: '956', color: 'from-cyan-400 to-blue-500' },
            ].map((ch, i) => (
              <motion.div key={ch.name} custom={i} variants={cardVariants} initial="hidden" animate="visible">
                <Link to={`/channel/${ch.name.toLowerCase()}`} className="group block">
                  <div className="relative rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                    <div className="relative aspect-video">
                      <div className={`w-full h-full bg-gradient-to-br ${ch.color} opacity-30 flex items-center justify-center`}>
                        <Video className="w-8 h-8 text-foreground/30" />
                      </div>
                      <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        LIVE
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {ch.viewers}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${ch.color} flex items-center justify-center shrink-0`}>
                          <span className="text-sm font-bold text-white">{ch.name[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">{ch.name}'s Stream</h3>
                          <p className="text-sm text-muted-foreground truncate">{ch.name}</p>
                          <p className="text-xs text-muted-foreground">{ch.category}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Promotional Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/80 to-accent p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
            <p className="text-primary-foreground font-semibold text-sm md:text-base">
              Watch live streams on SIGMA and earn exclusive rewards!
            </p>
          </div>
          <Link to="/gifts">
            <Button size="sm" variant="secondary" className="rounded-full text-xs font-bold shrink-0">
              Learn More
            </Button>
          </Link>
        </motion.div>

        {/* Empty state */}
        {!loading && liveStreams.length === 0 && recommendedChannels.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to SIGMA</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Start exploring or go live to get started!</p>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
