import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: {
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
  };
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  onCommentClick: () => void;
}

export function PostCard({ post, likeCount, commentCount, isLiked: initialLiked, onCommentClick }: PostCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(likeCount);
  const [saved, setSaved] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const handleLike = async () => {
    if (!user) return;
    if (liked) {
      setLiked(false);
      setLikes(l => l - 1);
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      setLiked(true);
      setLikes(l => l + 1);
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
    }
  };

  const profile = post.profiles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-destructive to-accent-foreground p-[2px]">
              <Avatar className="w-full h-full border-2 border-card">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{profile?.display_name || 'User'}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="relative aspect-square bg-secondary/30">
          <img
            src={post.media_urls[imageIndex]}
            alt="Post"
            className="w-full h-full object-cover"
          />
          {post.media_urls.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {post.media_urls.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === imageIndex ? 'bg-primary w-4' : 'bg-foreground/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleLike}
              className="flex items-center gap-1"
            >
              <Heart className={`w-6 h-6 transition-colors ${liked ? 'fill-destructive text-destructive' : 'text-foreground hover:text-muted-foreground'}`} />
            </motion.button>
            <button onClick={onCommentClick} className="flex items-center gap-1">
              <MessageCircle className="w-6 h-6 text-foreground hover:text-muted-foreground transition-colors" />
            </button>
            <button>
              <Share2 className="w-6 h-6 text-foreground hover:text-muted-foreground transition-colors" />
            </button>
          </div>
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => setSaved(!saved)}>
            <Bookmark className={`w-6 h-6 transition-colors ${saved ? 'fill-foreground text-foreground' : 'text-foreground hover:text-muted-foreground'}`} />
          </motion.button>
        </div>

        {/* Likes count */}
        <p className="text-sm font-semibold text-foreground">{likes.toLocaleString()} likes</p>

        {/* Caption */}
        {post.content && (
          <p className="text-sm text-foreground">
            <span className="font-semibold mr-1">{profile?.username || 'user'}</span>
            {post.content}
          </p>
        )}

        {/* Comments link */}
        {commentCount > 0 && (
          <button onClick={onCommentClick} className="text-sm text-muted-foreground">
            View all {commentCount} comments
          </button>
        )}
      </div>
    </motion.div>
  );
}
