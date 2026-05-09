import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trophy, Swords, Plus, Crown, Users, Lock, Globe, Mail } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface Clan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_url: string | null;
  visibility: string;
  member_count: number;
  wins: number;
  losses: number;
  owner_id: string;
}

export default function ClansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clans, setClans] = useState<Clan[]>([]);
  const [activeWars, setActiveWars] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'invite'>('public');

  const load = async () => {
    const { data } = await (supabase as any).from('clans').select('*').order('member_count', { ascending: false }).limit(30);
    setClans(data || []);
    const { data: wars } = await (supabase as any).from('clan_wars').select('*').eq('status', 'live').order('started_at', { ascending: false }).limit(10);
    setActiveWars(wars || []);
  };

  useEffect(() => { load(); }, []);

  const createClan = async () => {
    if (!user || !name.trim()) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '-' + Math.random().toString(36).slice(2, 6);
    const { data, error } = await (supabase as any).from('clans').insert({ name: name.trim(), slug, description: desc || null, owner_id: user.id, visibility }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    await (supabase as any).from('clan_members').insert({ clan_id: data.id, user_id: user.id, role: 'owner' });
    toast({ title: 'Clan created!', description: `Welcome, leader of ${name}.` });
    setCreateOpen(false); setName(''); setDesc('');
    load();
  };

  const visIcon = (v: string) => v === 'public' ? <Globe className="w-3 h-3" /> : v === 'private' ? <Lock className="w-3 h-3" /> : <Mail className="w-3 h-3" />;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-2"><Swords className="w-7 h-7 text-primary" /> Clans & Wars</h1>
            <p className="text-sm text-muted-foreground mt-1">Build your clan. Battle for gift supremacy. 5-minute matches, winner takes the crown.</p>
          </div>
          {user && <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-1" />Create clan</Button>}
        </div>

        {/* Active wars */}
        {activeWars.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Live Clan Wars</h2>
            <div className="space-y-3">
              {activeWars.map((w) => <WarCard key={w.id} war={w} />)}
            </div>
          </div>
        )}

        {/* Clan list */}
        <h2 className="text-lg font-bold mb-3">Top Clans</h2>
        {clans.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No clans yet. Be the first to found one.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {clans.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black truncate">{c.name}</h3>
                      <span className="text-xs px-1.5 py-0.5 bg-secondary rounded inline-flex items-center gap-1">{visIcon(c.visibility)}{c.visibility}</span>
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{c.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.member_count}</span>
                      <span>🏆 {c.wins}W</span>
                      <span>💀 {c.losses}L</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Found a new clan</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Clan name" value={name} onChange={(e) => setName(e.target.value)} />
              <Textarea placeholder="What does your clan stand for?" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
              <div className="flex gap-2">
                {(['public', 'private', 'invite'] as const).map((v) => (
                  <button key={v} onClick={() => setVisibility(v)} className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${visibility === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>{v}</button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={createClan} disabled={!name.trim()}>Found Clan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function WarCard({ war }: { war: any }) {
  const [scoreA, setScoreA] = useState(war.score_a || 0);
  const [scoreB, setScoreB] = useState(war.score_b || 0);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    // Live scoreboard via realtime
    const ch = supabase
      .channel(`war:${war.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clan_war_gifts', filter: `war_id=eq.${war.id}` }, (payload: any) => {
        if (payload.new.clan_id === war.clan_a) setScoreA((s) => s + payload.new.coin_value);
        else setScoreB((s) => s + payload.new.coin_value);
      })
      .subscribe();
    const t = setInterval(() => {
      if (!war.ends_at) return;
      const ms = new Date(war.ends_at).getTime() - Date.now();
      if (ms <= 0) { setTimeLeft('Ended'); return; }
      setTimeLeft(`${Math.floor(ms/60000)}:${String(Math.floor((ms%60000)/1000)).padStart(2,'0')}`);
    }, 500);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, [war.id, war.clan_a, war.ends_at]);

  const total = scoreA + scoreB || 1;
  const pctA = (scoreA / total) * 100;

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-amber-500 flex items-center gap-1"><Trophy className="w-3 h-3" /> LIVE WAR</span>
        <span className="text-xs font-mono font-bold">{timeLeft}</span>
      </div>
      <div className="flex items-center justify-between text-sm font-bold mb-1">
        <span>Clan A — {scoreA} 🪙</span>
        <span>{scoreB} 🪙 — Clan B</span>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden flex">
        <div className="bg-primary transition-all duration-500" style={{ width: `${pctA}%` }} />
        <div className="bg-amber-500 transition-all duration-500 flex-1" />
      </div>
    </div>
  );
}
