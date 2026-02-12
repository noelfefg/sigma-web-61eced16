import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface CommentsSheetProps {
  postId: string | null;
  open: boolean;
  onClose: () => void;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export function CommentsSheet({ postId, open, onClose }: CommentsSheetProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (postId && open) fetchComments();
  }, [postId, open]);

  const fetchComments = async () => {
    if (!postId) return;
    const { data } = await supabase
      .from('post_comments')
      .select('*, profiles(username, display_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setComments((data as Comment[]) || []);
  };

  const handleSend = async () => {
    if (!user || !postId || !newComment.trim()) return;
    setLoading(true);
    await supabase.from('post_comments').insert({
      post_id: postId,
      user_id: user.id,
      content: newComment.trim(),
    });
    setNewComment('');
    setLoading(false);
    fetchComments();
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="bg-card border-border/50 flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-foreground">Comments</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={c.profiles?.avatar_url || ''} />
                <AvatarFallback className="bg-secondary text-xs"><User className="w-3 h-3" /></AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm">
                  <span className="font-semibold text-foreground mr-1">{c.profiles?.username || 'user'}</span>
                  <span className="text-foreground/90">{c.content}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {user && (
          <div className="flex gap-2 pt-3 border-t border-border/50">
            <Input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Add a comment..."
              className="bg-secondary/50 border-border/50 rounded-full"
            />
            <Button size="icon" onClick={handleSend} disabled={loading || !newComment.trim()} className="rounded-full bg-primary shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
