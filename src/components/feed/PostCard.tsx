import { useState, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, User, Send, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [showHeart, setShowHeart] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lastTapRef = useRef(0);

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

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked) handleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 900);
    }
    lastTapRef.current = now;
  };

  const profile = post.profiles;
  const caption = post.content || '';
  const isLong = caption.length > 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-card via-card to-card/80 rounded-3xl border border-border/40 overflow-hidden shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 group"
    >
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-destructive to-accent opacity-60" />

      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary via-pink-500 to-amber-400 p-[2.5px] shadow-md shadow-primary/20">
              <Avatar className="w-full h-full border-2 border-card">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-xs">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-card" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground tracking-tight">{profile?.display_name || 'User'}</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              <span className="inline-flex items-center gap-0.5 ml-1 text-muted-foreground/70">
                <Eye className="w-3 h-3" /> {post.view_count}
              </span>
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Media with double-tap to like */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="relative aspect-square bg-gradient-to-br from-secondary/50 to-secondary/20 cursor-pointer" onClick={handleDoubleTap}>
          <img
            src={post.media_urls[imageIndex]}
            alt="Post"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
          {/* Gradient overlay bottom */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

          {/* Double-tap heart animation */}
          <AnimatePresence>
            {showHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 300 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart className="w-24 h-24 fill-white text-white drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image dots */}
          {post.media_urls.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
              {post.media_urls.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setImageIndex(i); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === imageIndex ? 'bg-primary w-5' : 'bg-white/50 w-1.5'}`}
                />
              ))}
            </div>
          )}

          {/* Post type badge */}
          {post.post_type === 'video' && (
            <div className="absolute top-3 right-3 bg-destructive/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              VIDEO
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.7 }}
              onClick={handleLike}
              className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
            >
              <Heart className={`w-6 h-6 transition-all duration-300 ${liked ? 'fill-destructive text-destructive scale-110' : 'text-foreground'}`} />
            </motion.button>
            <button onClick={onCommentClick} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
              <MessageCircle className="w-6 h-6 text-foreground" />
            </button>
            <button className="p-2 rounded-full hover:bg-accent/30 transition-colors">
              <Send className="w-6 h-6 text-foreground -rotate-12" />
            </button>
          </div>
          <motion.button whileTap={{ scale: 0.7 }} onClick={() => setSaved(!saved)} className="p-2 rounded-full hover:bg-amber-500/10 transition-colors">
            <Bookmark className={`w-6 h-6 transition-all duration-300 ${saved ? 'fill-amber-500 text-amber-500' : 'text-foreground'}`} />
          </motion.button>
        </div>

        {/* Like count with gradient */}
        <p className="text-sm font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {likes.toLocaleString()} likes
        </p>

        {/* Caption */}
        {caption && (
          <p className="text-sm text-foreground/90 leading-relaxed">
            <span className="font-bold text-foreground mr-1.5">{profile?.username || 'user'}</span>
            {isLong && !expanded ? caption.slice(0, 100) + '...' : caption}
            {isLong && (
              <button onClick={() => setExpanded(!expanded)} className="ml-1 text-muted-foreground hover:text-primary transition-colors font-medium">
                {expanded ? 'less' : 'more'}
              </button>
            )}
          </p>
        )}

        {/* Comments link */}
        {commentCount > 0 && (
          <button onClick={onCommentClick} className="text-sm text-muted-foreground hover:text-primary transition-colors">
            View all {commentCount} comments
          </button>
        )}
      </div>
    </motion.div>
  );
}
