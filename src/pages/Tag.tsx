import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Hash, ArrowLeft } from 'lucide-react';

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!tag) return;
    (async () => {
      setLoading(true);
      const { data: tagRow } = await (supabase as any).from('hashtags').select('id, use_count').eq('tag', tag.toLowerCase()).maybeSingle();
      if (!tagRow) { setPosts([]); setCount(0); setLoading(false); return; }
      setCount(tagRow.use_count || 0);
      const { data: links } = await (supabase as any).from('post_hashtags').select('post_id').eq('hashtag_id', tagRow.id).limit(100);
      const ids = (links || []).map((l: any) => l.post_id);
      if (!ids.length) { setPosts([]); setLoading(false); return; }
      const { data: ps } = await supabase.from('posts').select('id, content, title, thumbnail_url, created_at, user_id').in('id', ids).order('created_at', { ascending: false });
      setPosts(ps || []);
      setLoading(false);
    })();
  }, [tag]);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4">
        <Link to="/feed" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Hash className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black">#{tag}</h1>
            <p className="text-sm text-muted-foreground">{count} posts</p>
          </div>
        </div>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground">No posts yet for this tag.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4">
                {p.title && <h3 className="font-bold mb-1">{p.title}</h3>}
                <p className="text-sm whitespace-pre-wrap">{p.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
