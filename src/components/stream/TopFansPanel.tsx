import { useEffect, useState } from 'react';
import { Trophy, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface FanRow {
  user_id: string;
  total: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface Props {
  contextType: 'stream' | 'post' | 'short' | 'clan_war';
  contextId: string;
  limit?: number;
}

const MEDAL = ['from-amber-400 to-yellow-600', 'from-zinc-300 to-slate-400', 'from-orange-400 to-amber-600'];

export function TopFansPanel({ contextType, contextId, limit = 5 }: Props) {
  const [fans, setFans] = useState<FanRow[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data: gifts } = await supabase
        .from('gift_sends')
        .select('sender_id, coin_value')
        .eq('context_type', contextType)
        .eq('context_id', contextId);
      if (!gifts || !alive) return;
      const totals = new Map<string, number>();
      for (const g of gifts as any[]) {
        totals.set(g.sender_id, (totals.get(g.sender_id) || 0) + (g.coin_value || 0));
      }
      const ids = [...totals.keys()];
      if (ids.length === 0) { setFans([]); return; }
      const { data: profs } = await supabase.from('profiles').select('id,username,display_name,avatar_url').in('id', ids);
      const pmap = new Map((profs || []).map((p: any) => [p.id, p]));
      const rows: FanRow[] = ids.map(id => {
        const p: any = pmap.get(id);
        return {
          user_id: id,
          total: totals.get(id) || 0,
          username: p?.username || 'user',
          display_name: p?.display_name || 'User',
          avatar_url: p?.avatar_url || null,
        };
      }).sort((a, b) => b.total - a.total).slice(0, limit);
      if (alive) setFans(rows);
    };
    load();
    const ch = supabase.channel(`fans:${contextType}:${contextId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gift_sends', filter: `context_id=eq.${contextId}` }, load)
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [contextType, contextId, limit]);

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-bold text-foreground">Top Fans</h3>
      </div>
      {fans.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Be the first to gift this creator.</p>
      ) : (
        <ul className="space-y-2">
          {fans.map((f, i) => (
            <motion.li
              key={f.user_id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3"
            >
              <span className={`w-6 h-6 shrink-0 rounded-full text-[11px] font-bold flex items-center justify-center text-background ${i < 3 ? `bg-gradient-to-br ${MEDAL[i]}` : 'bg-secondary text-foreground'}`}>
                {i + 1}
              </span>
              <Avatar className="w-7 h-7"><AvatarImage src={f.avatar_url || ''} /><AvatarFallback className="bg-secondary text-[10px]">{f.display_name[0]}</AvatarFallback></Avatar>
              <span className="text-sm font-semibold text-foreground truncate flex-1">{f.display_name}</span>
              <span className="text-xs text-amber-400 font-bold flex items-center gap-0.5"><Coins className="w-3 h-3" />{f.total}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
