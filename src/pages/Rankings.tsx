import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LottieIcon, LottieEmptyState } from '@/components/animations/LottieIcon';

type Tab = 'streamers'|'gifters'|'viewers'|'rising';
interface User { rank:number; id:string; username:string; display_name:string; avatar_url:string|null; score:number; label:string; is_live?:boolean; }

const TAB_ICONS: Record<Tab, any> = {
  streamers: 'fire', gifters: 'gift', viewers: 'wave', rising: 'rocket',
};
const PODIUM_ICONS = ['crown', 'medal', 'star'] as const;

export default function RankingsPage() {
  const [tab, setTab] = useState<Tab>('streamers');
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [tab]);

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'streamers') {
        const { data: d } = await supabase.from('streams')
          .select('viewer_count,profiles!inner(id,username,display_name,avatar_url)')
          .eq('is_live',true).order('viewer_count',{ascending:false}).limit(20);
        setData((d||[]).map((s:any,i:number)=>({
          rank:i+1,id:s.profiles.id,username:s.profiles.username,
          display_name:s.profiles.display_name,avatar_url:s.profiles.avatar_url,
          score:s.viewer_count,label:'viewers',is_live:true,
        })));
      } else {
        const { data: d } = await supabase.from('profiles')
          .select('id,username,display_name,avatar_url').limit(20);
        const list = ((d||[]) as any[]).map((p,i)=>({
          rank:0,id:p.id,username:p.username,display_name:p.display_name,
          avatar_url:p.avatar_url,
          score: 0,
          label: tab==='gifters'?'gifts sent':tab==='rising'?'new followers':'hrs watched',
        })).sort((a,b)=>b.score-a.score).map((u,i)=>({...u,rank:i+1}));
        setData(list);
      }
    } catch {}
    setLoading(false);
  };

  const top3 = data.slice(0,3);
  const rest = data.slice(3);

  const tabs: [Tab,string][] = [['streamers','Streamers'],['gifters','Gifters'],['viewers','Viewers'],['rising','Rising']];

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 py-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background:'rgba(180,180,180,0.08)', border:'1px solid rgba(180,180,180,0.15)' }}>
            <LottieIcon name="trophy" size={36} loop autoplay />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">Rankings</h1>
            <p className="text-xs text-muted-foreground">Top creators on SIGMA</p>
          </div>
          <div className="ml-auto">
            <LottieIcon name="stars" size={40} loop autoplay />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto no-scrollbar">
          {tabs.map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                tab===t ? 'bg-muted-foreground text-background' : 'bg-card text-muted-foreground'
              }`}
            >
              <LottieIcon name={TAB_ICONS[t]} size={16} loop autoplay />
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-12">
            <LottieIcon name="loadingDots" size={80} loop autoplay />
            <p className="text-sm mt-2 text-muted-foreground">Loading rankings…</p>
          </div>
        ) : data.length === 0 ? (
          <LottieEmptyState name="trophy" title="No rankings yet" description="Start streaming to appear here!" />
        ) : (
          <>
            {/* Podium */}
            {top3.length >= 3 && (
              <div className="flex items-end justify-center gap-3 mb-8 pt-4">
                {[top3[1],top3[0],top3[2]].map((u,i) => {
                  const isFirst = i===1;
                  const podiumH = ['h-20','h-28','h-14'][i];
                  return (
                    <motion.div key={u.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}}
                      className="flex flex-col items-center gap-1"
                    >
                      {/* Crown/Medal/Star animation above top 3 */}
                      <LottieIcon name={PODIUM_ICONS[i]} size={isFirst ? 40 : 28} loop autoplay />
                      <div className="relative">
                        <Avatar className={`${isFirst?'w-16 h-16':'w-12 h-12'} rounded-full ring-2 ${isFirst ? 'ring-muted-foreground' : 'ring-border'}`}>
                          <AvatarImage src={u.avatar_url||''}/>
                          <AvatarFallback className="bg-card text-muted-foreground font-extrabold">{u.display_name[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {u.is_live && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background bg-red-500" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-center max-w-[70px] truncate text-foreground">{u.display_name}</p>
                      <div className={`w-14 ${podiumH} rounded-t-lg flex flex-col items-center justify-end pb-2 ${isFirst ? 'bg-muted-foreground/10 border border-muted-foreground/30' : 'bg-card border border-border'}`}>
                        <p className="text-xs font-bold text-muted-foreground">{u.score.toLocaleString()}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Rest of list */}
            <div className="space-y-1.5">
              {rest.map((u,i) => (
                <motion.div key={u.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-accent transition-colors"
                >
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 bg-secondary text-muted-foreground">#{u.rank}</span>
                  <Avatar className="w-9 h-9 rounded-full shrink-0">
                    <AvatarImage src={u.avatar_url||''}/>
                    <AvatarFallback className="bg-card text-muted-foreground font-extrabold">{u.display_name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link to={`/channel/${u.username}`}>
                      <p className="text-sm font-semibold truncate text-foreground">{u.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <LottieIcon name={TAB_ICONS[tab]} size={20} loop autoplay />
                    <div className="text-right">
                      <p className="text-sm font-bold text-muted-foreground">{u.score.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{u.label}</p>
                    </div>
                  </div>
                  {u.is_live && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground">LIVE</span>}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}