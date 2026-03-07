import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PostCard } from '@/components/feed/PostCard';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { StoriesBar } from '@/components/feed/StoriesBar';
import { SuggestedUsers } from '@/components/feed/SuggestedUsers';
import { FeedTabs } from '@/components/feed/FeedTabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(username, display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);

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
        const { data: userLikes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', ids);
        setLikedPosts(new Set((userLikes || []).map((l: any) => l.post_id)));
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    const channel = supabase
      .channel('feed-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-2xl font-black bg-gradient-to-r from-primary via-pink-500 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Feed
          </h1>
          <CreatePostDialog onPostCreated={fetchPosts} />
        </motion.div>

        {/* Stories */}
        <StoriesBar />

        {/* Tabs */}
        <FeedTabs active={activeTab} onChange={setActiveTab} />

        {/* Main content area */}
        <div className="flex gap-6">
          {/* Posts column */}
          <div className="flex-1 space-y-5 min-w-0">
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-3 bg-card rounded-3xl p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-11 h-11 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="w-full aspect-square rounded-2xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 space-y-5"
              >
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 via-pink-500/10 to-amber-500/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary/50" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No Posts Yet</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Share your first post and start connecting with the community!</p>
              </motion.div>
            ) : (
              <div className="space-y-5">
                {posts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
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
              </div>
            )}
          </div>

          {/* Suggested users - desktop only */}
          <div className="hidden lg:block w-72 shrink-0 space-y-5 sticky top-24 self-start">
            <SuggestedUsers />
          </div>
        </div>

        <CommentsSheet
          postId={commentPostId}
          open={!!commentPostId}
          onClose={() => setCommentPostId(null)}
        />
      </div>
    </AppLayout>
  );
}
