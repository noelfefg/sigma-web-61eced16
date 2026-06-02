import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import Stepper, { Step } from '@/components/ui/stepper/Stepper';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

type Scope = 'users' | 'streams' | 'posts';
const SCOPES: { id: Scope; label: string }[] = [
  { id: 'users', label: 'Users' },
  { id: 'streams', label: 'Streams' },
  { id: 'posts', label: 'Posts' },
];

export default function SearchTestPage() {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('users');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const q = `%${query.trim()}%`;
    let data: any[] = [];
    if (scope === 'users') {
      const r = await supabase.from('profiles').select('id, username, display_name, avatar_url').or(`username.ilike.${q},display_name.ilike.${q}`).limit(20);
      data = r.data || [];
    } else if (scope === 'streams') {
      const r = await (supabase as any).from('streams').select('id, title, category, is_live').ilike('title', q).limit(20);
      data = r.data || [];
    } else {
      const r = await (supabase as any).from('posts').select('id, content, created_at').ilike('content', q).limit(20);
      data = r.data || [];
    }
    setResults(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold mb-1">Search Test</h1>
        <p className="text-sm text-muted-foreground mb-6">Step through a query, pick a scope, see live results.</p>

        <Stepper initialStep={1} nextButtonText="Next" backButtonText="Back" onFinalStepCompleted={runSearch}>
          <Step>
            <h2 className="text-lg font-semibold mb-3">1 — Query</h2>
            <Input placeholder="Search SIGMA…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-2">{query.length} chars</p>
          </Step>

          <Step>
            <h2 className="text-lg font-semibold mb-3">2 — Scope</h2>
            <div className="flex gap-2 flex-wrap">
              {SCOPES.map((s) => (
                <button key={s.id} onClick={() => setScope(s.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${scope === s.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </Step>

          <Step>
            <h2 className="text-lg font-semibold mb-3">3 — Results</h2>
            <button onClick={runSearch} disabled={loading || !query}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 mb-3">
              <Search className="w-4 h-4" /> {loading ? 'Searching…' : `Search ${scope}`}
            </button>
            <div className="space-y-2 max-h-72 overflow-auto">
              {results.length === 0 && !loading && <p className="text-sm text-muted-foreground">No results yet.</p>}
              {results.map((r) => (
                <div key={r.id} className="p-2 rounded-md border border-border bg-card text-sm">
                  {scope === 'users' && <div>@{r.username} <span className="text-muted-foreground">{r.display_name}</span></div>}
                  {scope === 'streams' && <div>{r.title} <span className="text-muted-foreground">· {r.category}</span></div>}
                  {scope === 'posts' && <div className="line-clamp-2">{r.content}</div>}
                </div>
              ))}
            </div>
          </Step>
        </Stepper>
      </div>
    </div>
  );
}
