import { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PostCard } from '@/components/feed/PostCard';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { FeedTabs } from '@/components/feed/FeedTabs';
import { StoriesBar } from '@/components/feed/StoriesBar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Sparkles, Search, Image, ListFilter, MapPin, Smile, Video, Play, Users, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SuggestedUsers } from '@/components/feed/SuggestedUsers';
import { Link } from 'react-router-dom';

interface FeedItem {
  id: string;
  type: 'post' | 'stream' | 'short';
  content: string | null;
  media_urls: string[];
  post_type: string;
  created_at: string;
  view_count: number;
  user_id: string;
  title?: string | null;
  is_live?: boolean;
  thumbnail_url?: string | null;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export default function FeedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('foryou');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('avatar_url').eq('id', user.id).single().then(({ data }) => setAvatarUrl(data?.avatar_url || null));
  }, [user]);

  const fetchFeed = useCallback(async (reset = false) => {
    if (reset) { setLoading(true); setPage(0); }
    const offset = reset ? 0 : page * 30;

    // Fetch posts, live streams, and shorts in parallel
    const [postsRes, streamsRes, shortsRes] = await Promise.all([
      supabase.from('posts').select('*, profiles(username, display_name, avatar_url)')
        .order('created_at', { ascending: false }).range(offset, offset + 19),
      supabase.from('streams').select('*, profiles!inner(username, display_name, avatar_url)')
        .eq('is_live', true).order('viewer_count', { ascending: false }).limit(5),
      supabase.from('shorts').select('*, profiles!shorts_user_id_fkey(username, display_name, avatar_url)')
        .order('created_at', { ascending: false }).range(offset, offset + 9),
    ]);

    const posts: FeedItem[] = (postsRes.data || []).map((p: any) => ({
      ...p, type: 'post' as const, media_urls: p.media_urls || [],
    }));
    const streams: FeedItem[] = (streamsRes.data || []).map((s: any) => ({
      id: s.id, type: 'stream' as const, content: s.description, media_urls: [],
      post_type: 'stream', created_at: s.created_at, view_count: s.viewer_count,
      user_id: s.user_id, title: s.title, is_live: true, thumbnail_url: s.thumbnail_url,
      profiles: s.profiles,
    }));
    const shorts: FeedItem[] = (shortsRes.data || []).map((s: any) => ({
      id: s.id, type: 'short' as const, content: s.title, media_urls: s.video_url ? [s.video_url] : [],
      post_type: 'short', created_at: s.created_at, view_count: s.view_count,
      user_id: s.user_id, title: s.title, thumbnail_url: s.thumbnail_url,
      profiles: s.profiles,
    }));

    // Simple ranking: mix by recency + view_count
    let all = [...posts, ...streams, ...shorts];

    if (activeTab === 'following' && user) {
      const { data: following } = await supabase.from('followers').select('following_id').eq('follower_id', user.id);
      const followingIds = new Set((following || []).map((f: any) => f.following_id));
      all = all.filter(item => followingIds.has(item.user_id));
    } else {
      // For You: rank by score
      all.sort((a, b) => {
        const scoreA = a.view_count + (a.is_live ? 10000 : 0) + (a.type === 'stream' ? 5000 : 0);
        const scoreB = b.view_count + (b.is_live ? 10000 : 0) + (b.type === 'stream' ? 5000 : 0);
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return (scoreB + timeB / 1e10) - (scoreA + timeA / 1e10);
      });
    }

    if (reset) {
      setItems(all);
    } else {
      setItems(prev => [...prev, ...all.filter(a => !prev.find(p => p.id === a.id))]);
    }
    setHasMore(posts.length >= 20);

    // Fetch like/comment counts for posts
    const postIds = all.filter(i => i.type === 'post').map(i => i.id);
    if (postIds.length > 0) {
      const [likesRes, commentsRes] = await Promise.all([
        supabase.from('post_likes').select('post_id').in('post_id', postIds),
        supabase.from('post_comments').select('post_id').in('post_id', postIds),
      ]);
      const lc: Record<string, number> = {};
      const cc: Record<string, number> = {};
      (likesRes.data || []).forEach((l: any) => { lc[l.post_id] = (lc[l.post_id] || 0) + 1; });
      (commentsRes.data || []).forEach((c: any) => { cc[c.post_id] = (cc[c.post_id] || 0) + 1; });
      setLikeCounts(prev => ({ ...prev, ...lc }));
      setCommentCounts(prev => ({ ...prev, ...cc }));
      if (user) {
        const { data: userLikes } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds);
        setLikedPosts(new Set((userLikes || []).map((l: any) => l.post_id)));
      }
    }
    setLoading(false);
  }, [user, activeTab, page]);

  useEffect(() => { fetchFeed(true); }, [activeTab, user]);

  useEffect(() => {
    const channel = supabase.channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => fetchFeed(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchFeed]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(p => p + 1);
      }
    }, { threshold: 0.5 });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  useEffect(() => { if (page > 0) fetchFeed(); }, [page]);

  return (
    <AppLayout>
      <div className="max-w-[1200px] mx-auto">
        <div className="flex">
          {/* Main Feed Column */}
          <div className="flex-1 min-w-0 border-r border-border/40 max-w-[600px]">
            <FeedTabs active={activeTab} onChange={setActiveTab} />

            {/* Stories */}
            <div className="border-b border-border/40 p-3">
              <StoriesBar />
            </div>

            {/* Compose Box */}
            {user && (
              <div className="border-b border-border/40 px-4 pt-3 pb-2">
                <div className="flex gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0 mt-1">
                    <AvatarImage src={avatarUrl || ''} />
                    <AvatarFallback className="bg-secondary text-muted-foreground"><Camera className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="min-h-[52px] flex items-center">
                      <p className="text-xl text-muted-foreground/60 select-none">What is happening?!</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/30 pt-2 mt-1">
                      <div className="flex items-center gap-0.5 -ml-2">
                        <button className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"><Image className="w-[18px] h-[18px]" /></button>
                        <button className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"><ListFilter className="w-[18px] h-[18px]" /></button>
                        <button className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"><Smile className="w-[18px] h-[18px]" /></button>
                        <button className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"><MapPin className="w-[18px] h-[18px]" /></button>
                      </div>
                      <CreatePostDialog onPostCreated={() => fetchFeed(true)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Feed Items */}
            {loading ? (
              <div className="divide-y divide-border/30">
                {[1,2,3].map(i => (
                  <div key={i} className="p-4 space-y-3">
                    <div className="flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-full" /><div className="space-y-1"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-3 w-16" /></div></div>
                    <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" />
                    <Skeleton className="w-full aspect-video rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary/50" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Welcome to Sigma</h3>
                <p className="text-muted-foreground text-[15px] max-w-xs mx-auto">
                  {activeTab === 'following' ? 'Follow creators to see their content here!' : 'This is the best place to see what\'s happening. Share your first post!'}
                </p>
              </motion.div>
            ) : (
              <div className="divide-y divide-border/30">
                {items.map((item, i) => (
                  <motion.div key={`${item.type}-${item.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                    {item.type === 'stream' ? (
                      <Link to={`/watch/${item.profiles?.username}`} className="block px-4 py-3 hover:bg-accent/10 transition-colors">
                        <div className="flex gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={item.profiles?.avatar_url || ''} />
                            <AvatarFallback className="bg-secondary"><Users className="w-4 h-4" /></AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded">LIVE</span>
                              <span className="text-sm font-bold text-foreground">{item.profiles?.display_name}</span>
                            </div>
                            <p className="text-sm text-foreground font-medium">{item.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{item.view_count} viewers</span>
                            </div>
                            {item.thumbnail_url && (
                              <div className="mt-2 rounded-2xl overflow-hidden border border-border/30">
                                <img src={item.thumbnail_url} alt="" className="w-full aspect-video object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ) : item.type === 'short' ? (
                      <Link to="/shorts" className="block px-4 py-3 hover:bg-accent/10 transition-colors">
                        <div className="flex gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={item.profiles?.avatar_url || ''} />
                            <AvatarFallback className="bg-secondary"><Play className="w-4 h-4" /></AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded">Lil Vid</span>
                              <span className="text-sm font-bold text-foreground">{item.profiles?.display_name}</span>
                            </div>
                            {item.title && <p className="text-sm text-foreground">{item.title}</p>}
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Eye className="w-3 h-3" />{item.view_count} views
                            </div>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <PostCard
                        post={{ ...item, media_urls: item.media_urls || [] }}
                        likeCount={likeCounts[item.id] || 0}
                        commentCount={commentCounts[item.id] || 0}
                        isLiked={likedPosts.has(item.id)}
                        onCommentClick={() => setCommentPostId(item.id)}
                      />
                    )}
                  </motion.div>
                ))}
                {/* Infinite scroll sentinel */}
                <div ref={observerRef} className="h-10 flex items-center justify-center">
                  {hasMore && <div className="w-5 h-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-[350px] shrink-0 pl-6 pr-4 py-3 space-y-4 sticky top-16 self-start">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search" className="pl-11 bg-secondary/60 border-transparent focus:border-primary/50 rounded-full h-[42px] text-[15px]" />
            </div>

            <div className="bg-card rounded-2xl p-4 border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-extrabold text-foreground">Subscribe to Premium</h3>
                <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">50% off</span>
              </div>
              <p className="text-[13px] text-muted-foreground mb-3 leading-snug">Get rid of ads, see your analytics, boost your replies and unlock 20+ features.</p>
              <button className="bg-foreground text-background font-bold text-[15px] py-2 px-5 rounded-full hover:opacity-90 transition-opacity">Subscribe</button>
            </div>

            <SuggestedUsers />
          </div>
        </div>

        <CommentsSheet postId={commentPostId} open={!!commentPostId} onClose={() => setCommentPostId(null)} />
      </div>
    </AppLayout>
  );
}
