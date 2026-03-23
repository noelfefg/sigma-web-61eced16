import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { BarChart2, Video, Eye, Users, TrendingUp, Settings, Play, Upload, Pencil, Radio, DollarSign, Clock, Plus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LordIcon, ICONS } from '@/components/ui/LordIcon';
import { motion } from 'framer-motion';
import { LottieIcon, LottieEmptyState } from '@/components/animations/LottieIcon';

type Tab = 'dashboard'|'content'|'analytics'|'settings';

export default function CreatorStudioPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [profile, setProfile] = useState<any>(null);
  const [streams, setStreams] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => { if (data) { setProfile(data); setDisplayName(data.display_name||''); setBio(data.bio||''); } });
    supabase.from('streams').select('*').eq('user_id', user.id)
      .order('created_at',{ascending:false}).limit(20)
      .then(({ data }) => { if (data) setStreams(data); });
  }, [user]);

  if (!user) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Radio className="w-12 h-12 opacity-20" style={{color:'#1a56db'}}/>
        <p style={{color:'#888'}}>Sign in to access Creator Studio</p>
        <Link to="/auth"><button className="kick-btn">Sign In</button></Link>
      </div>
    </AppLayout>
  );

  const tabs: [Tab,string,React.ReactNode][] = [
    ['dashboard','Dashboard',<LordIcon icon={ICONS.chart} size={22} trigger="loop" primary="1a56db" 2 className="w-4 h-4"/>],
    ['content','Content',<Video className="w-4 h-4"/>],
    ['analytics','Analytics',<LordIcon icon={ICONS.trending} size={22} trigger="loop" primary="22c55e"  className="w-4 h-4"/>],
    ['settings','Channel',<Settings className="w-4 h-4"/>],
  ];

  const saveSettings = async () => {
    await supabase.from('profiles').update({ display_name:displayName, bio }).eq('id', user.id);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-5">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl" style={{background:'#111',border:'1px solid #1e1e1e'}}>
          <Avatar className="w-14 h-14 rounded-xl">
            <AvatarImage src={profile?.avatar_url||''}/>
            <AvatarFallback style={{background:'#1a1a1a',color:'#1a56db',fontWeight:800,fontSize:20}}>{profile?.display_name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-lg font-black" style={{color:'#fff'}}>Creator Studio</h1>
            <p className="text-sm" style={{color:'#555'}}>@{profile?.username||user.email?.split('@')[0]}</p>
          </div>
          <Link to="/go-live">
            <button className="kick-btn flex items-center gap-2"><Radio className="w-3.5 h-3.5"/>Go Live</button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto no-scrollbar" style={{background:'#111'}}>
          {tabs.map(([t,l,icon]) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all shrink-0"
              style={{ background: tab===t?'#1a1a1a':'transparent', color: tab===t?'#1a56db':'#555' }}
            >{icon}{l}</button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {label:'Total Views',val:'0',icon:<LordIcon icon={ICONS.eye} size={18} trigger="hover" primary="1a56db" className="w-4 h-4"/>,col:'#1a56db'},
                {label:'Followers',val:'0',icon:<LordIcon icon={ICONS.users} size={18} trigger="hover" primary="1a56db" className="w-4 h-4"/>,col:'#22c55e'},
                {label:'Hours Streamed',val:'0',icon:<Clock className="w-4 h-4"/>,col:'#f59e0b'},
                {label:'Earnings',val:'$0',icon:<DollarSign className="w-4 h-4"/>,col:'#a78bfa'},
              ].map(s => (
                <div key={s.label} className="p-4 rounded-2xl" style={{background:'#111',border:'1px solid #1e1e1e'}}>
                  <div className="flex items-center gap-2 mb-2" style={{color:s.col}}>{s.icon}<span className="text-xs font-semibold" style={{color:'#555'}}>{s.label}</span></div>
                  <p className="text-2xl font-black" style={{color:'#e8e8e8'}}>{s.val}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl" style={{background:'#111',border:'1px solid #1e1e1e'}}>
              <h3 className="text-sm font-bold mb-3" style={{color:'#888'}}>Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {label:'Go Live',icon:<Radio className="w-4 h-4"/>,path:'/go-live',accent:true},
                  {label:'Edit Profile',icon:<Pencil className="w-4 h-4"/>,path:'/settings'},
                  {label:'Friends',icon:<LordIcon icon={ICONS.users} size={18} trigger="hover" primary="1a56db" className="w-4 h-4"/>,path:'/friends'},
                  {label:'View Channel',icon:<Play className="w-4 h-4"/>,path:profile?.username?`/channel/${profile.username}`:'/you'},
                ].map(a => (
                  <Link key={a.label} to={a.path}>
                    <button className="w-full flex flex-col items-center gap-2 p-3 rounded-xl transition-colors hover:opacity-90"
                      style={{
                        background: a.accent?'rgba(26,86,219,0.1)':'#1a1a1a',
                        color: a.accent?'#1a56db':'#888',
                        border:`1px solid ${a.accent?'rgba(26,86,219,0.2)':'#222'}`,
                      }}
                    >{a.icon}<span className="text-xs font-semibold">{a.label}</span></button>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{background:'#111',border:'1px solid #1e1e1e'}}>
              <div className="px-4 py-3 flex items-center justify-between" style={{borderBottom:'1px solid #1e1e1e'}}>
                <h3 className="text-sm font-bold" style={{color:'#e8e8e8'}}>Recent Streams</h3>
              </div>
              {streams.length === 0 ? (
                <div className="py-12 text-center">
                  <Radio className="w-10 h-10 mx-auto mb-3 opacity-20" style={{color:'#1a56db'}}/>
                  <p className="text-sm" style={{color:'#555'}}>No streams yet</p>
                  <Link to="/go-live"><button className="kick-btn mt-3">Start Streaming</button></Link>
                </div>
              ) : streams.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3" style={{borderBottom:'1px solid #1a1a1a'}}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{background:'#1a1a1a'}}>
                    <Play className="w-4 h-4" style={{color:'#1a56db'}}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{color:'#e8e8e8'}}>{s.title}</p>
                    <p className="text-xs" style={{color:'#555'}}>{new Date(s.created_at).toLocaleDateString()} · {s.viewer_count||0} viewers</p>
                  </div>
                  {s.is_live && <span className="text-[9px] font-black px-1.5 py-0.5 rounded animate-pulse" style={{background:'#ef4444',color:'#fff'}}>LIVE</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'content' && (
          <div className="py-12 text-center rounded-2xl" style={{background:'#111',border:'1px solid #1e1e1e'}}>
            <Video className="w-10 h-10 mx-auto mb-3 opacity-20" style={{color:'#1a56db'}}/>
            <p className="text-sm" style={{color:'#555'}}>Your VODs will appear here after streams end</p>
          </div>
        )}

        {tab === 'analytics' && (
          <div className="py-12 text-center rounded-2xl" style={{background:'#111',border:'1px solid #1e1e1e'}}>
            <LordIcon icon={ICONS.trending} size={22} trigger="loop" primary="22c55e"  className="w-10 h-10 mx-auto mb-3 opacity-20" style={{color:'#1a56db'}}/>
            <p className="font-bold mb-1" style={{color:'#e8e8e8'}}>Analytics Coming Soon</p>
            <p className="text-sm" style={{color:'#555'}}>Detailed stream and content insights</p>
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl space-y-4" style={{background:'#111',border:'1px solid #1e1e1e'}}>
              <h3 className="text-sm font-bold" style={{color:'#e8e8e8'}}>Channel Settings</h3>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{color:'#555'}}>Display Name</label>
                <input className="kick-search w-full" value={displayName} onChange={e=>setDisplayName(e.target.value)}/>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{color:'#555'}}>Bio</label>
                <textarea className="kick-search w-full h-20 resize-none" value={bio} onChange={e=>setBio(e.target.value)} placeholder="Tell viewers about yourself..."/>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{background:'#1a1a1a'}}>
                <div>
                  <p className="text-sm font-semibold" style={{color:'#e8e8e8'}}>OBS Studio</p>
                  <p className="text-xs" style={{color:'#555'}}>Server: rtmp://live.sigma.tv/live</p>
                </div>
                <Link to="/go-live"><button className="kick-btn-outline text-xs">Get Key</button></Link>
              </div>
              <button onClick={saveSettings} className="kick-btn w-full justify-center">Save Changes</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
