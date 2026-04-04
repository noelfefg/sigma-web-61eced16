import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, UserCheck, Users, Bell, MessageSquare, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LordIcon, ICONS } from '@/components/ui/LordIcon';
import { LottieIcon, LottieEmptyState } from '@/components/animations/LottieIcon';
import { motion, AnimatePresence } from 'framer-motion';

interface Profile { id: string; username: string; display_name: string; avatar_url: string|null; is_live?: boolean; }
type Tab = 'discover'|'friends'|'requests';
type DiscoverFilter = 'anyone'|'following';

export default function FriendsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('discover');
  const [filter, setFilter] = useState<DiscoverFilter>('anyone');
  const [query, setQuery] = useState('');
  const [discover, setDiscover] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: f } = await supabase.from('followers')
      .select('following_id, profiles!followers_following_id_fkey(id,username,display_name,avatar_url)')
      .eq('follower_id', user.id).limit(50);
    if (f) {
      setFollowingIds(new Set(f.map((r: any) => r.following_id)));
      setFriends(f.map((r: any) => r.profiles).filter(Boolean));
    }
    const { data: all } = await supabase.from('profiles')
      .select('id,username,display_name,avatar_url').neq('id', user.id).limit(40);
    if (all) setDiscover(all as Profile[]);
    setLoading(false);
  };

  const addFriend = async (id: string) => {
    if (!user) return;
    await supabase.from('followers').upsert({ follower_id: user.id, following_id: id });
    setFollowingIds(p => new Set([...p, id]));
    const added = discover.find(u => u.id === id);
    if (added) setFriends(p => [added, ...p]);
    toast({ title: 'Friend added!' });
  };

  const removeFriend = async (id: string) => {
    if (!user) return;
    await supabase.from('followers').delete().eq('follower_id', user.id).eq('following_id', id);
    setFollowingIds(p => { const n = new Set(p); n.delete(id); return n; });
    setFriends(p => p.filter(u => u.id !== id));
    toast({ title: 'Removed' });
  };

  const filtered = (tab === 'friends' ? friends : discover).filter(u => {
    if (tab === 'friends') return true;
    const q = query.toLowerCase();
    const matches = !q || u.display_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
    if (filter === 'following') return matches && followingIds.has(u.id);
    return matches;
  });

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 py-5">
        <div className="mb-5">
          <h1 className="text-xl font-black" style={{ color:'#fff' }}>Friends</h1>
          <p className="text-xs mt-0.5" style={{ color:'#555' }}>Connect with creators on SIGMA</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background:'#111' }}>
          {(['discover','friends','requests'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize"
              style={{ background: tab===t?'#1a1a1a':'transparent', color: tab===t?'#fff':'#555' }}
            >{t}{t==='friends' && followingIds.size>0 && <span className="ml-1 px-1 py-0.5 rounded text-[9px]" style={{ background:'#6b7280', color:'#000' }}>{followingIds.size}</span>}</button>
          ))}
        </div>

        {tab === 'discover' && (
          <div className="space-y-3 mb-4">
            <div className="relative">
              <LordIcon icon={ICONS.search} size={16} trigger="loop-on-hover" primary="555555" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color:'#555' }}/>
              <input className="kick-search pl-9 w-full" placeholder="Search by name or username..." value={query} onChange={e => setQuery(e.target.value)}/>
            </div>
            {/* X.com-style filter pills */}
            <div className="space-y-2">
              <p className="text-xs font-bold" style={{ color:'#555' }}>People</p>
              <div className="flex flex-wrap gap-2">
                {([['anyone','From anyone'],['following','People you follow']] as [DiscoverFilter,string][]).map(([f,l]) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                    style={{ background: filter===f?'#fff': '#1a1a1a', color: filter===f?'#000':'#888', border:`1px solid ${filter===f?'#fff':'#333'}` }}
                  >{l}</button>
                ))}
              </div>
              <p className="text-xs font-bold mt-2" style={{ color:'#555' }}>Location</p>
              <div className="flex flex-wrap gap-2">
                {['Anywhere','Near you'].map(l => (
                  <button key={l}
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background:'#1a1a1a', color:'#888', border:'1px solid #333' }}
                  >{l}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse" style={{ background:'#111' }}>
                    <div className="w-11 h-11 rounded-full" style={{ background:'#1a1a1a' }}/>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 rounded" style={{ background:'#1a1a1a' }}/>
                      <div className="h-2.5 w-16 rounded" style={{ background:'#1a1a1a' }}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : tab === 'requests' ? (
              <div className="text-center py-14">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color:'#6b7280' }}/>
                <p style={{ color:'#555' }}>No pending requests</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-14">
                <LordIcon icon={ICONS.users} size={18} trigger="hover" primary="6b7280" className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color:'#6b7280' }}/>
                <p style={{ color:'#555' }}>{tab==='friends' ? 'No friends yet' : 'No users found'}</p>
                {tab==='friends' && <button onClick={() => setTab('discover')} className="kick-btn mt-3">Find Friends</button>}
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map(u => (
                  <motion.div key={u.id} layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#1a1a1a] transition-colors"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="w-10 h-10 rounded-full">
                        <AvatarImage src={u.avatar_url||''}/>
                        <AvatarFallback style={{ background:'#1a1a1a', color:'#6b7280', fontWeight:800 }}>{u.display_name[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {u.is_live && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#111] animate-pulse"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/channel/${u.username}`}>
                        <p className="text-sm font-semibold truncate" style={{ color:'#e8e8e8' }}>{u.display_name}</p>
                        <p className="text-xs truncate" style={{ color:'#555' }}>@{u.username}</p>
                      </Link>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {followingIds.has(u.id) ? (
                        <>
                          <Link to="/messages">
                            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#1a1a1a] transition-colors" title="Message">
                              <MessageSquare className="w-3.5 h-3.5" style={{ color:'#6b7280' }}/>
                            </button>
                          </Link>
                          <button onClick={() => removeFriend(u.id)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors" title="Unfollow">
                            <UserX className="w-3.5 h-3.5 text-red-400"/>
                          </button>
                        </>
                      ) : (
                        <button onClick={() => addFriend(u.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                          style={{ background:'#6b7280', color:'#000' }}
                        ><LordIcon icon={ICONS.plus} size={18} trigger="click" primary="6b7280" className="w-3 h-3"/>Add</button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
