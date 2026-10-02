import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Compass, Radio } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/common/InputGroup';
import { StreamRail } from '@/components/sigma/StreamRail';
import { StreamCard } from '@/components/sigma/StreamCard';
import { CreatorCard } from '@/components/sigma/CreatorCard';
import { CreatorHoverCard } from '@/components/sigma/CreatorHoverCard';
import { GlassCard } from '@/components/sigma/GlassCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { SigmaStream, SigmaUser } from '@/types/sigma';

export default function BrowsePage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [streams, setStreams] = useState<SigmaStream[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [creators, setCreators] = useState<SigmaUser[]>([]);
  const [sigmatized, setSigmatized] = useState<SigmaStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: live }, { data: people }] = await Promise.all([
        supabase
          .from('streams')
          .select(
            'id, title, viewer_count, thumbnail_url, is_live, profiles!inner(id, username, display_name, avatar_url), categories(name, slug)',
          )
          .eq('is_live', true)
          .order('viewer_count', { ascending: false })
          .limit(60),
        supabase.from('profiles').select('id, username, display_name, avatar_url').order('created_at', { ascending: false }).limit(16),
      ]);
      if (cancelled) return;
      setStreams((live as unknown as SigmaStream[]) ?? []);
      setCreators((people as SigmaUser[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) { setInterests([]); return; }
    let cancelled = false;
    supabase.from('user_interests').select('interest').eq('user_id', user.id).then(({ data }) => {
      if (!cancelled) setInterests((data ?? []).filter((row) => row.interest.startsWith('interests:')).map((row) => row.interest.slice('interests:'.length)));
    });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSigmatized([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: follows } = await supabase.from('followers').select('following_id').eq('follower_id', user.id);
      const ids = (follows ?? []).map((f) => f.following_id);
      if (!ids.length) {
        if (!cancelled) setSigmatized([]);
        return;
      }
      const { data } = await supabase
        .from('streams')
        .select(
          'id, title, viewer_count, thumbnail_url, is_live, profiles!inner(id, username, display_name, avatar_url), categories(name, slug)',
        )
        .eq('is_live', true)
        .in('user_id', ids)
        .order('viewer_count', { ascending: false });
      if (!cancelled) setSigmatized((data as unknown as SigmaStream[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return streams.filter((s) => {
      const matchesQuery =
        !q || s.title.toLowerCase().includes(q) || s.profiles.display_name.toLowerCase().includes(q);
      return matchesQuery;
    }).sort((a, b) => Number(interests.includes(b.categories?.slug ?? '')) - Number(interests.includes(a.categories?.slug ?? '')) || b.viewerCount - a.viewerCount);
  }, [streams, query, interests]);

  const featured = filtered[0];
  const trending = filtered.slice(1, 13);

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1400px] space-y-8 px-3 py-5 md:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card">
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight">Discover</h1>
              <p className="text-xs text-muted-foreground">Live channels and creators on Sigma.</p>
            </div>
          </div>
          <Link to="/live">
            <Button size="sm" variant="secondary" className="h-9 rounded-full text-xs font-semibold">
              <Radio className="mr-1.5 h-3.5 w-3.5" />
              All live
            </Button>
          </Link>
        </header>

        <InputGroup className="h-12">
          <InputGroupAddon>
            <Search className="h-4 w-4" />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter live channels"
            aria-label="Filter live channels"
          />
        </InputGroup>

        {loading ? (
          <Skeleton className="aspect-video w-full rounded-3xl" />
        ) : featured ? (
          <StreamCard stream={featured} featured />
        ) : (
          <GlassCard className="px-6 py-14 text-center">
            <Radio className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-semibold">Nobody is live right now</p>
            <p className="mt-1 text-xs text-muted-foreground">Follow creators or start your own broadcast.</p>
          </GlassCard>
        )}

        {user && (
          <StreamRail
            title="From channels you Sigmatize"
            description="Live right now"
            items={sigmatized}
            loading={loading}
            empty="None of your channels are live yet."
            renderItem={(s, i) => <StreamCard stream={s} index={i} />}
            action={
              <Link to="/following" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                See all
              </Link>
            }
          />
        )}

        <StreamRail
          title="Trending live"
          description="Sorted by current viewers"
          items={trending}
          loading={loading}
          empty="No live channels match this filter."
          renderItem={(s, i) => <StreamCard stream={s} index={i} />}
        />

        <StreamRail
          title="Creators on Sigma"
          description="New and active profiles"
          items={creators}
          loading={loading}
          basis="basis-1/2 sm:basis-1/3 lg:basis-1/5 xl:basis-[14%]"
          empty="No creators yet."
          renderItem={(c, i) => (
            <CreatorHoverCard user={c}>
              <div>
                <CreatorCard user={c} index={i} />
              </div>
            </CreatorHoverCard>
          )}
        />

      </div>
    </AppLayout>
  );
}
