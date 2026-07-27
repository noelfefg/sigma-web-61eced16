import { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Send, MessageCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface CommentsSheetProps { postId: string | null; open: boolean; onClose: () => void; }
interface Comment {
  id: string; content: string; created_at: string; user_id: string; parent_id: string | null;
  profiles?: { username: string; display_name: string; avatar_url: string | null };
}

export function CommentsSheet({ postId, open, onClose }: CommentsSheetProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (postId && open) load(); }, [postId, open]);

  const load = async () => {
    if (!postId) return;
    const { data } = await supabase
      .from('post_comments')
      .select('id,content,created_at,user_id,parent_id, profiles(username, display_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setComments((data as Comment[]) || []);
  };

  const tree = useMemo(() => {
    const roots: Comment[] = [];
    const childMap = new Map<string, Comment[]>();
    for (const c of comments) {
      if (c.parent_id) {
        const arr = childMap.get(c.parent_id) || [];
        arr.push(c); childMap.set(c.parent_id, arr);
      } else roots.push(c);
    }
    return { roots, childMap };
  }, [comments]);

  const send = async () => {
    if (!user || !postId || !draft.trim()) return;
    setLoading(true);
    await supabase.from('post_comments').insert({
      post_id: postId, user_id: user.id, content: draft.trim(),
      parent_id: replyTo?.id ?? null,
    });
    setDraft(''); setReplyTo(null); setLoading(false);
    load();
  };

  const renderComment = (c: Comment, depth = 0) => {
    const children = tree.childMap.get(c.id) || [];
    return (
      <div key={c.id} className={depth > 0 ? 'ml-8 pl-3 border-l border-border' : ''}>
        <div className="flex gap-3 group">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={c.profiles?.avatar_url || ''} />
            <AvatarFallback className="bg-secondary text-xs"><User className="w-3 h-3" /></AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-semibold text-foreground mr-1">{c.profiles?.username || 'user'}</span>
              <span className="text-foreground/90 break-words">{c.content}</span>
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
              {user && (
                <button onClick={() => setReplyTo(c)} className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> Reply
                </button>
              )}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
              </span>
            </div>
          </div>
        </div>
        {children.length > 0 && <div className="mt-3 space-y-3">{children.map(ch => renderComment(ch, depth + 1))}</div>}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="bg-card border-border/50 flex flex-col">
        <SheetHeader><SheetTitle className="text-foreground">Comments</SheetTitle></SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {tree.roots.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
          )}
          {tree.roots.map(c => renderComment(c))}
        </div>

        {user && (
          <div className="pt-3 border-t border-border/50 space-y-2">
            {replyTo && (
              <div className="flex items-center justify-between text-xs bg-secondary/50 rounded-md px-2 py-1.5">
                <span className="text-muted-foreground truncate">Replying to <span className="text-foreground font-semibold">@{replyTo.profiles?.username}</span></span>
                <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={draft} onChange={e => setDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder={replyTo ? `Reply to @${replyTo.profiles?.username}…` : 'Add a comment...'}
                className="bg-secondary/50 border-border/50 rounded-full"
              />
              <Button size="icon" onClick={send} disabled={loading || !draft.trim()} className="rounded-full bg-primary shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
