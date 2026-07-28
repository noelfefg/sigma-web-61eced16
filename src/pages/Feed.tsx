import { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PostCard } from '@/components/feed/PostCard';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Feather } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';

const PAGE_SIZE = 20;

interface FeedPost {
  id: string;
  content: string | null;
  media_urls: string[];
  post_type: string;
  created_at: string;
  view_count: number;
  user_id: string;
  profiles?: { username: string; display_name: string; avatar_url: string | null };
}

type Tab = 'latest' | 'following';

export default function FeedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('latest');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle()
      .then(({ data }) => setAvatarUrl(data?.avatar_url || null));
  }, [user]);

  const loadCounts = useCallback(async (postIds: string[]) => {
    if (postIds.length === 0) return;
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
      setLikedPosts(prev => new Set([...prev, ...(userLikes || []).map((l: any) => l.post_id)]));
    }
  }, [user]);

  const fetchPage = useCallback(async (reset: boolean) => {
    if (reset) { pageRef.current = 0; setLoading(true); } else { setLoadingMore(true); }
    const from = pageRef.current * PAGE_SIZE;

    let followingIds: string[] | null = null;
    if (tab === 'following') {
      if (!user) {
        setItems([]); setHasMore(false); setLoading(false); setLoadingMore(false);
        return;
      }
      const { data } = await supabase.from('followers').select('following_id').eq('follower_id', user.id);
      followingIds = (data || []).map((f: any) => f.following_id);
      if (followingIds.length === 0) {
        setItems([]); setHasMore(false); setLoading(false); setLoadingMore(false);
        return;
      }
    }

    let query = supabase
      .from('posts')
      .select('id, content, media_urls, post_type, created_at, view_count, user_id, profiles(username, display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (followingIds) query = query.in('user_id', followingIds);

    const { data } = await query;
    const posts: FeedPost[] = (data || []).map((p: any) => ({ ...p, media_urls: p.media_urls || [] }));

    setItems(prev => reset ? posts : [...prev, ...posts.filter(p => !prev.some(x => x.id === p.id))]);
    setHasMore(posts.length === PAGE_SIZE);
    await loadCounts(posts.map(p => p.id));
    setLoading(false);
    setLoadingMore(false);
  }, [tab, user, loadCounts]);

  useEffect(() => { fetchPage(true); }, [tab, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: new posts appear at the top
  useEffect(() => {
    const channel = supabase.channel('feed-posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => fetchPage(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPage]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
        pageRef.current += 1;
        fetchPage(false);
      }
    }, { rootMargin: '400px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchPage]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'latest', label: 'Latest' },
    { id: 'following', label: 'Sigmatized' },
  ];

  return (
    <AppLayout>
      <div className="max-w-[640px] mx-auto">
        <div className="border-x border-border/40 min-h-screen">
          {/* Tabs */}
          <div className="sticky top-14 z-20 flex bg-background/85 backdrop-blur border-b border-border/40">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex-1 py-3.5 text-sm font-semibold transition-colors ${tab === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'}`}
              >
                {t.label}
                {tab === t.id && (
                  <motion.span layoutId="feedTab" className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-14 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }} />
                )}
              </button>
            ))}
          </div>

          {/* Composer */}
          {user && (
            <div className="border-b border-border/40 px-4 py-3">
              <div className="flex gap-3 items-center">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={avatarUrl || ''} />
                  <AvatarFallback className="bg-secondary text-muted-foreground"><Camera className="w-4 h-4" /></AvatarFallback>
                </Avatar>
                <p className="flex-1 text-lg text-muted-foreground/60 select-none">What is happening?</p>
                <CreatePostDialog onPostCreated={() => fetchPage(true)} />
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="divide-y divide-border/30">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-3 w-16" /></div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24 px-6 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary flex items-center justify-center">
                <Feather className="w-7 h-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-bold">{tab === 'following' ? 'Nothing from people you follow' : 'No posts yet'}</h2>
              <p className="text-sm text-muted-foreground">
                {tab === 'following'
                  ? 'Sigmatize more people to fill this timeline.'
                  : user ? 'Be the first to post something.' : 'Sign in to start posting.'}
              </p>
              {!user && <Link to="/auth" className="inline-block text-sm font-semibold text-primary">Sign in</Link>}
            </motion.div>
          ) : (
            <div className="divide-y divide-border/30">
              <AnimatePresence initial={false}>
                {items.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i, 6) * 0.02 }}
                  >
                    <PostCard
                      post={post}
                      likeCount={likeCounts[post.id] || 0}
                      commentCount={commentCounts[post.id] || 0}
                      isLiked={likedPosts.has(post.id)}
                      onCommentClick={() => setCommentPostId(post.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <div ref={sentinelRef} className="h-16 flex items-center justify-center">
            {loadingMore && <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
          </div>
        </div>
      </div>

      <CommentsSheet postId={commentPostId} open={!!commentPostId} onClose={() => setCommentPostId(null)} />
    </AppLayout>
  );
}
