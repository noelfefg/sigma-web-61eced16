import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, User, Send, Eye, Mail, Repeat2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ReportButton } from '@/components/shared/ReportButton';

interface PostCardProps {
  post: {
    id: string; content: string | null; media_urls: string[]; post_type: string;
    created_at: string; view_count: number; user_id: string;
    profiles?: { username: string; display_name: string; avatar_url: string | null; };
  };
  likeCount: number; commentCount: number; isLiked: boolean; onCommentClick: () => void;
}

export function PostCard({ post, likeCount, commentCount, isLiked: initialLiked, onCommentClick }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(likeCount);
  const [saved, setSaved] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lastTapRef = useRef(0);

  const handleLike = async () => {
    if (!user) return;
    if (liked) { setLiked(false); setLikes(l => l - 1); await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id); }
    else { setLiked(true); setLikes(l => l + 1); await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id }); }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) { if (!liked) handleLike(); setShowHeart(true); setTimeout(() => setShowHeart(false), 900); }
    lastTapRef.current = now;
  };

  const profile = post.profiles;
  const caption = post.content || '';
  const isLong = caption.length > 200;

  return (
    <div className="px-4 py-3 hover:bg-accent/10 transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="w-10 h-10">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-bold text-foreground truncate">{profile?.display_name || 'User'}</span>
            <span className="text-sm text-muted-foreground truncate">@{profile?.username || 'user'}</span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-sm text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: false })}
            </span>
            <div className="ml-auto flex items-center">
              <ReportButton targetType="post" targetId={post.id} variant="icon" className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary" />
              <Button variant="ghost" size="icon" className="text-muted-foreground h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {caption && (
            <p className="text-sm text-foreground leading-relaxed mb-2">
              {isLong && !expanded ? caption.slice(0, 200) + '...' : caption}
              {isLong && (
                <button onClick={() => setExpanded(!expanded)} className="ml-1 text-primary hover:underline text-sm font-medium">
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </p>
          )}

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="relative rounded-2xl overflow-hidden border border-border/30 mb-2 cursor-pointer" onClick={handleDoubleTap}>
              <img src={post.media_urls[imageIndex]} alt="" className="w-full max-h-[500px] object-cover" />
              <AnimatePresence>
                {showHeart && (
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.4, type: 'spring' }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Heart className="w-20 h-20 fill-white text-white drop-shadow-2xl" />
                  </motion.div>
                )}
              </AnimatePresence>
              {post.media_urls.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
                  {post.media_urls.map((_, i) => (
                    <button key={i} onClick={(e) => { e.stopPropagation(); setImageIndex(i); }} className={`h-1.5 rounded-full transition-all ${i === imageIndex ? 'bg-primary w-4' : 'bg-white/50 w-1.5'}`} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions - X/Twitter style */}
          <div className="flex items-center justify-between max-w-md -ml-2">
            <button onClick={onCommentClick} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors"><MessageCircle className="w-4 h-4" /></div>
              {commentCount > 0 && <span className="text-xs">{commentCount}</span>}
            </button>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-emerald-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-emerald-500/10 transition-colors"><Repeat2 className="w-4 h-4" /></div>
            </button>
            <motion.button whileTap={{ scale: 0.8 }} onClick={handleLike} className="flex items-center gap-1.5 transition-colors group">
              <div className={`p-2 rounded-full transition-colors ${liked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive group-hover:bg-destructive/10'}`}>
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              </div>
              {likes > 0 && <span className={`text-xs ${liked ? 'text-destructive' : 'text-muted-foreground'}`}>{likes}</span>}
            </motion.button>
            <div className="flex items-center gap-0.5">
              <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors group">
                <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors"><Eye className="w-4 h-4" /></div>
                <span className="text-xs">{post.view_count}</span>
              </button>
              <motion.button whileTap={{ scale: 0.8 }} onClick={() => setSaved(!saved)} className="text-muted-foreground hover:text-primary transition-colors group">
                <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                  <Bookmark className={`w-4 h-4 ${saved ? 'fill-primary text-primary' : ''}`} />
                </div>
              </motion.button>
              <button className="text-muted-foreground hover:text-primary transition-colors group">
                <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors"><Share2 className="w-4 h-4" /></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
