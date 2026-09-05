import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Compass, Sparkles, Radio, Users } from 'lucide-react';
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

import categoryGaming from '@/assets/category-gaming.jpg.asset.json';
import categoryCreative from '@/assets/category-creative.jpg.asset.json';
import categoryMusic from '@/assets/category-music.jpg.asset.json';
import categoryEducation from '@/assets/category-education.jpg.asset.json';
import categoryIrl from '@/assets/category-irl.jpg.asset.json';
import categoryJustChatting from '@/assets/category-just-chatting.jpg.asset.json';
import categoryPodcast from '@/assets/category-podcast.jpg.asset.json';
import categorySports from '@/assets/category-sports.jpg.asset.json';

const categoryImages: Record<string, string> = {
  gaming: categoryGaming.url,
  creative: categoryCreative.url,
  music: categoryMusic.url,
  education: categoryEducation.url,
  irl: categoryIrl.url,
  'just-chatting': categoryJustChatting.url,
  podcast: categoryPodcast.url,
  sports: categorySports.url,
};

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

export default function BrowsePage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [streams, setStreams] = useState<SigmaStream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creators, setCreators] = useState<SigmaUser[]>([]);
  const [sigmatized, setSigmatized] = useState<SigmaStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: cats }, { data: live }, { data: people }] = await Promise.all([
        supabase.from('categories').select('id, name, slug, image_url').order('name'),
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
      setCategories(cats ?? []);
      setStreams((live as unknown as SigmaStream[]) ?? []);
      setCreators((people as SigmaUser[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      const matchesCategory = !selected || s.categories?.slug === selected;
      return matchesQuery && matchesCategory;
    });
  }, [streams, query, selected]);

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
              <p className="text-xs text-muted-foreground">Live channels, creators and categories on Sigma.</p>
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

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <Button
            size="sm"
            variant={selected === null ? 'default' : 'secondary'}
            className="h-8 shrink-0 rounded-full text-xs"
            onClick={() => setSelected(null)}
          >
            All
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={selected === c.slug ? 'default' : 'secondary'}
              className="h-8 shrink-0 rounded-full text-xs"
              onClick={() => setSelected(selected === c.slug ? null : c.slug)}
            >
              {c.name}
            </Button>
          ))}
        </div>

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

        <section className="space-y-3" aria-label="Categories">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-bold tracking-tight sm:text-lg">Categories</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => {
              const count = streams.filter((s) => s.categories?.slug === c.slug).length;
               const image = categoryImages[c.slug] || c.image_url;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(selected === c.slug ? null : c.slug)}
                  className="group relative overflow-hidden rounded-3xl border border-border bg-card text-left transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[16/9]">
                    {image ? (
                      <img
                        src={image}
                        alt={c.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-secondary" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute inset-x-3 bottom-3">
                      <p className="text-sm font-semibold text-white">{c.name}</p>
                      <p className="flex items-center gap-1 text-[11px] text-white/70">
                        <Users className="h-3 w-3" />
                        {count} live
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
