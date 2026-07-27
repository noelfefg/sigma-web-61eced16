import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { AnimatePresence, motion } from 'framer-motion';

interface Result {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export function UserSearch({ className = '' }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(8);
      setResults(data || []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search people"
        aria-label="Search people"
        className="pl-9 h-9 bg-secondary border-0 rounded-full text-sm"
      />
      <AnimatePresence>
        {open && query.trim().length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />Searching…
              </div>
            ) : results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">No people found</p>
            ) : (
              results.map((r) => (
                <Link
                  key={r.id}
                  to={`/channel/${r.username}`}
                  onClick={() => { setOpen(false); setQuery(''); }}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={r.avatar_url || ''} />
                    <AvatarFallback className="text-xs bg-secondary">{r.display_name?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{r.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">@{r.username}</p>
                  </div>
                </Link>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
