import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PostCard } from '@/components/feed/PostCard';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';
import { CommentsSheet } from '@/components/feed/CommentsSheet';
import { StoriesBar } from '@/components/feed/StoriesBar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera } from 'lucide-react';

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

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(username, display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);

    const postsList = (data as Post[]) || [];
    setPosts(postsList);

    // Fetch like & comment counts
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

      // Check which posts current user liked
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

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('feed-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto py-6 px-4 space-y-6">
        {/* Stories */}
        <StoriesBar />

        {/* Create post */}
        <div className="flex justify-center">
          <CreatePostDialog onPostCreated={fetchPosts} />
        </div>

        {/* Feed */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-3 px-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="w-full aspect-square rounded-2xl" />
                <div className="px-4 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
              <Camera className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">No Posts Yet</h3>
            <p className="text-muted-foreground text-sm">Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                likeCount={likeCounts[post.id] || 0}
                commentCount={commentCounts[post.id] || 0}
                isLiked={likedPosts.has(post.id)}
                onCommentClick={() => setCommentPostId(post.id)}
              />
            ))}
          </div>
        )}

        {/* Comments Sheet */}
        <CommentsSheet
          postId={commentPostId}
          open={!!commentPostId}
          onClose={() => setCommentPostId(null)}
        />
      </div>
    </AppLayout>
  );
}
