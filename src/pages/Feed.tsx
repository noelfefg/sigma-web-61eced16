import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PostCard } from '@/components/feed/PostCard';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { FeedTabs } from '@/components/feed/FeedTabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Sparkles, Hash, Search, Image, ListFilter, MapPin, Smile } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SuggestedUsers } from '@/components/feed/SuggestedUsers';

interface Post {
  id: string;
  content: string | null;
  media_urls: string[];
  post_type: string;
  created_at: string;
  view_count: number;
  user_id: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('foryou');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('avatar_url').eq('id', user.id).single().then(({ data }) => setAvatarUrl(data?.avatar_url || null));
  }, [user]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('posts').select('*, profiles(username, display_name, avatar_url)').order('created_at', { ascending: false }).limit(50);
    const postsList = (data as Post[]) || [];
    setPosts(postsList);
    const ids = postsList.map(p => p.id);
    if (ids.length > 0) {
      const [likesRes, commentsRes] = await Promise.all([
        supabase.from('post_likes').select('post_id').in('post_id', ids),
        supabase.from('post_comments').select('post_id').in('post_id', ids),
      ]);
      const lc: Record<string, number> = {};
      const cc: Record<string, number> = {};
      (likesRes.data || []).forEach((l: any) => { lc[l.post_id] = (lc[l.post_id] || 0) + 1; });
      (commentsRes.data || []).forEach((c: any) => { cc[c.post_id] = (cc[c.post_id] || 0) + 1; });
      setLikeCounts(lc);
      setCommentCounts(cc);
      if (user) {
        const { data: userLikes } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', ids);
        setLikedPosts(new Set((userLikes || []).map((l: any) => l.post_id)));
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    const channel = supabase.channel('feed-posts').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  return (
    <AppLayout>
      <div className="max-w-[1200px] mx-auto">
        <div className="flex">
          {/* Main Feed Column */}
          <div className="flex-1 min-w-0 border-r border-border/40 max-w-[600px]">
            {/* Tabs */}
            <FeedTabs active={activeTab} onChange={setActiveTab} />
            
            {/* Compose Box — X style */}
            {user && (
              <div className="border-b border-border/40 px-4 pt-3 pb-2">
                <div className="flex gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0 mt-1">
                    <AvatarImage src={avatarUrl || ''} />
                    <AvatarFallback className="bg-secondary text-muted-foreground">
                      <Camera className="w-4 h-4" />
                    </AvatarFallback>
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
                      <CreatePostDialog onPostCreated={fetchPosts} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Posts */}
            {loading ? (
              <div className="divide-y divide-border/30">
                {[1,2,3].map(i => (
                  <div key={i} className="p-4 space-y-3">
                    <div className="flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-full" /><div className="space-y-1"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-3 w-16" /></div></div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="w-full aspect-video rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary/50" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Welcome to Sigma</h3>
                <p className="text-muted-foreground text-[15px] max-w-xs mx-auto">This is the best place to see what's happening. Share your first post!</p>
              </motion.div>
            ) : (
              <div className="divide-y divide-border/30">
                {posts.map((post, i) => (
                  <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <PostCard
                      post={post}
                      likeCount={likeCounts[post.id] || 0}
                      commentCount={commentCounts[post.id] || 0}
                      isLiked={likedPosts.has(post.id)}
                      onCommentClick={() => setCommentPostId(post.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar — X style */}
          <div className="hidden lg:block w-[350px] shrink-0 pl-6 pr-4 py-3 space-y-4 sticky top-16 self-start">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search" className="pl-11 bg-secondary/60 border-transparent focus:border-primary/50 rounded-full h-[42px] text-[15px]" />
            </div>

            {/* Subscribe CTA */}
            <div className="bg-card rounded-2xl p-4 border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-extrabold text-foreground">Subscribe to Premium</h3>
                <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">50% off</span>
              </div>
              <p className="text-[13px] text-muted-foreground mb-3 leading-snug">Get rid of ads, see your analytics, boost your replies and unlock 20+ features.</p>
              <button className="bg-foreground text-background font-bold text-[15px] py-2 px-5 rounded-full hover:opacity-90 transition-opacity">Subscribe</button>
            </div>

            {/* Trending */}
            <div className="bg-card rounded-2xl border border-border/40 overflow-hidden">
              <h3 className="text-xl font-extrabold text-foreground p-4 pb-0">What's happening</h3>
              {[
                { category: 'Gaming', topic: 'Fortnite Season 8', posts: '24.5K' },
                { category: 'Music', topic: 'New Album Drop', posts: '18.2K' },
                { category: 'Technology', topic: 'AI Breakthrough', posts: '42.1K' },
                { category: 'Sports', topic: 'Champions League', posts: '31.8K' },
              ].map((item) => (
                <div key={item.topic} className="px-4 py-3 hover:bg-accent/30 transition-colors cursor-pointer">
                  <p className="text-[13px] text-muted-foreground">{item.category} · Trending</p>
                  <p className="text-[15px] font-bold text-foreground">{item.topic}</p>
                  <p className="text-[13px] text-muted-foreground">{item.posts} posts</p>
                </div>
              ))}
              <button className="w-full text-left px-4 py-3 text-primary hover:bg-accent/30 transition-colors text-[15px]">Show more</button>
            </div>

            {/* Suggested */}
            <SuggestedUsers />
          </div>
        </div>

        <CommentsSheet postId={commentPostId} open={!!commentPostId} onClose={() => setCommentPostId(null)} />
      </div>
    </AppLayout>
  );
}
