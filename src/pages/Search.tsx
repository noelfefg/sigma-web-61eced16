import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X, Users, Radio, Hash } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/common/InputGroup';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/common/Item';
import { SigmaAvatar } from '@/components/common/AvatarGroup';
import { SigmaBadge } from '@/components/common/SigmaBadge';
import { CreatorHoverCard } from '@/components/sigma/CreatorHoverCard';
import { StreamCard } from '@/components/sigma/StreamCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { SigmaStream, SigmaUser } from '@/types/sigma';

interface Tag {
  id: string;
  tag: string;
  use_count: number;
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') ?? '';
  const [query, setQuery] = useState(initial);
  const [debounced, setDebounced] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<SigmaUser[]>([]);
  const [streams, setStreams] = useState<SigmaStream[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 280);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setParams(debounced ? { q: debounced } : {}, { replace: true });
  }, [debounced, setParams]);

  useEffect(() => {
    let cancelled = false;
    if (!debounced) {
      setPeople([]);
      setStreams([]);
      setTags([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const like = `%${debounced}%`;
      const [{ data: profiles }, { data: live }, { data: hashtags }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .or(`username.ilike.${like},display_name.ilike.${like}`)
          .limit(20),
        supabase
          .from('streams')
          .select(
            'id, title, viewer_count, thumbnail_url, is_live, profiles!inner(id, username, display_name, avatar_url), categories(name, slug)',
          )
          .eq('is_live', true)
          .ilike('title', like)
          .limit(12),
        supabase.from('hashtags').select('id, tag, use_count').ilike('tag', `%${debounced.replace('#', '')}%`).limit(15),
      ]);
      if (cancelled) return;
      setPeople((profiles as SigmaUser[]) ?? []);
      setStreams((live as unknown as SigmaStream[]) ?? []);
      setTags(hashtags ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const total = useMemo(() => people.length + streams.length + tags.length, [people, streams, tags]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-5 px-3 py-5 md:px-6">
        <h1 className="text-xl font-black tracking-tight">Search</h1>

        <InputGroup className="h-12">
          <InputGroupAddon>
            <SearchIcon className="h-4 w-4" />
          </InputGroupAddon>
          <InputGroupInput
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, live channels and tags"
            aria-label="Search Sigma"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </InputGroup>

        {!debounced ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Start typing to search Sigma.</p>
        ) : loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : total === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No results for “{debounced}”.</p>
        ) : (
          <Tabs defaultValue="people">
            <TabsList className="rounded-full">
              <TabsTrigger value="people" className="rounded-full text-xs">
                <Users className="mr-1.5 h-3.5 w-3.5" />
                People {people.length > 0 && `(${people.length})`}
              </TabsTrigger>
              <TabsTrigger value="live" className="rounded-full text-xs">
                <Radio className="mr-1.5 h-3.5 w-3.5" />
                Live {streams.length > 0 && `(${streams.length})`}
              </TabsTrigger>
              <TabsTrigger value="tags" className="rounded-full text-xs">
                <Hash className="mr-1.5 h-3.5 w-3.5" />
                Tags {tags.length > 0 && `(${tags.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="people" className="mt-4">
              {people.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No people found.</p>
              ) : (
                <ItemGroup>
                  {people.map((p) => (
                    <CreatorHoverCard key={p.id} user={p}>
                      <Link to={`/channel/${p.username}`}>
                        <Item interactive>
                          <ItemMedia>
                            <SigmaAvatar person={p} />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle>{p.display_name}</ItemTitle>
                            <ItemDescription>@{p.username}</ItemDescription>
                          </ItemContent>
                          <ItemActions>
                            <Button size="sm" variant="secondary" className="h-8 rounded-full text-xs">
                              View
                            </Button>
                          </ItemActions>
                        </Item>
                      </Link>
                    </CreatorHoverCard>
                  ))}
                </ItemGroup>
              )}
            </TabsContent>

            <TabsContent value="live" className="mt-4">
              {streams.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No live channels match.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {streams.map((s, i) => (
                    <StreamCard key={s.id} stream={s} index={i} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tags" className="mt-4">
              {tags.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No tags match.</p>
              ) : (
                <ItemGroup>
                  {tags.map((t) => (
                    <Item key={t.id} interactive>
                      <ItemMedia>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                          <Hash className="h-4 w-4" />
                        </span>
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>#{t.tag}</ItemTitle>
                        <ItemDescription>
                          {t.use_count} post{t.use_count === 1 ? '' : 's'}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <SigmaBadge kind="category" label="Tag" />
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
