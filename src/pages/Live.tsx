import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StreamCard } from '@/components/sigma/StreamCard';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import type { SigmaStream } from '@/types/sigma';

export default function LivePage() {
  const [streams, setStreams] = useState<SigmaStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: live } = await supabase
          .from('streams')
          .select(
            'id, title, viewer_count, thumbnail_url, is_live, profiles!inner(id, username, display_name, avatar_url), categories(name, slug)',
          )
          .eq('is_live', true)
          .order('viewer_count', { ascending: false });
      if (cancelled) return;
      setStreams((live as unknown as SigmaStream[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px] space-y-6 px-3 py-5 md:px-6">
        <header className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card">
            <Radio className="h-5 w-5 text-destructive" />
          </span>
          <div>
            <h1 className="text-xl font-black tracking-tight">Live now</h1>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading live channels…' : `${streams.length} channel${streams.length === 1 ? '' : 's'} streaming`}
            </p>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-[16/10] rounded-3xl" />
            ))}
          </div>
        ) : streams.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 px-6 py-16 text-center">
            <Radio className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-semibold text-foreground">No live channels right now</p>
            <p className="mt-1 text-xs text-muted-foreground">Start your own broadcast and be the first one live.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {streams.map((s, i) => (
              <StreamCard key={s.id} stream={s} index={i} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
