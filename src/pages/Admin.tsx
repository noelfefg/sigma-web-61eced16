import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Radio, BarChart2, MessageSquare, Trash2,
  Ban, Eye, Search, ChevronDown, AlertTriangle, CheckCircle2,
  TrendingUp, Activity, UserX, UserCheck, RefreshCw,
} from 'lucide-react';

type Tab = 'overview' | 'users' | 'streams' | 'content' | 'feedback';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  bio: string | null;
}

interface Stream {
  id: string;
  title: string;
  is_live: boolean;
  viewer_count: number;
  created_at: string;
  user_id: string;
  profiles?: { username: string; display_name: string; avatar_url: string | null };
}

interface FeedbackItem {
  id: string;
  category: string;
  message: string;
  rating: number;
  created_at: string;
  user_id: string;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Data
  const [users, setUsers] = useState<Profile[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState({ users: 0, streams: 0, liveNow: 0, posts: 0, feedback: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  // Check admin role
  useEffect(() => {
    if (!user) { setIsAdmin(false); setLoading(false); return; }
    (supabase as any).rpc('has_role', { _user_id: user.id, _role: 'admin' })
      .then(({ data }: any) => { setIsAdmin(!!data); setLoading(false); })
      .catch(() => { setIsAdmin(false); setLoading(false); });
  }, [user]);

  // Load data
  useEffect(() => {
    if (!isAdmin) return;
    loadAll();
  }, [isAdmin]);

  const loadAll = async () => {
    const [
      { count: userCount },
      { count: streamCount },
      { data: liveStreams },
      { count: postCount },
      { count: fbCount },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('streams').select('*', { count: 'exact', head: true }),
      supabase.from('streams').select('id').eq('is_live', true),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('feedback').select('*', { count: 'exact', head: true }),
    ]);

    setStats({
      users: userCount || 0,
      streams: streamCount || 0,
      liveNow: liveStreams?.length || 0,
      posts: postCount || 0,
      feedback: fbCount || 0,
    });

    const { data: u } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100);
    if (u) setUsers(u as Profile[]);

    const { data: s } = await supabase.from('streams')
      .select('id,title,is_live,viewer_count,created_at,user_id,profiles(username,display_name,avatar_url)')
      .order('created_at', { ascending: false }).limit(50);
    if (s) setStreams(s as any);

    const { data: fb } = await supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(50);
    if (fb) setFeedback(fb as FeedbackItem[]);
  };

  const deleteStream = async (id: string) => {
    await supabase.from('streams').delete().eq('id', id);
    setStreams(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Stream deleted' });
  };

  const deleteFeedback = async (id: string) => {
    await supabase.from('feedback').delete().eq('id', id);
    setFeedback(prev => prev.filter(f => f.id !== id));
    toast({ title: 'Feedback removed' });
  };

  const endStream = async (id: string) => {
    await supabase.from('streams').update({ is_live: false, ended_at: new Date().toISOString() }).eq('id', id);
    setStreams(prev => prev.map(s => s.id === id ? { ...s, is_live: false } : s));
    toast({ title: 'Stream ended' });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="w-6 h-6 animate-spin" style={{ color: '#1a56db' }} />
        </div>
      </AppLayout>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-black" style={{ color: '#fff' }}>Access Denied</h2>
          <p className="text-sm text-center max-w-xs" style={{ color: '#555' }}>
            You don't have admin privileges. Contact the platform administrator.
          </p>
          <Link to="/">
            <button className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#1a56db', color: '#fff' }}>
              Go Home
            </button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const filteredUsers = users.filter(u =>
    !searchQuery || u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, count: stats.users },
    { id: 'streams', label: 'Streams', icon: <Radio className="w-4 h-4" />, count: stats.liveNow },
    { id: 'content', label: 'Content', icon: <Eye className="w-4 h-4" />, count: stats.posts },
    { id: 'feedback', label: 'Feedback', icon: <MessageSquare className="w-4 h-4" />, count: stats.feedback },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-5">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 p-5 rounded-2xl" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(26,86,219,0.1)', border: '1px solid rgba(26,86,219,0.2)' }}>
            <Shield className="w-6 h-6" style={{ color: '#1a56db' }} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black" style={{ color: '#fff' }}>Admin Dashboard</h1>
            <p className="text-xs" style={{ color: '#555' }}>Platform management & moderation</p>
          </div>
          <button onClick={loadAll} className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" style={{ color: '#888' }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all"
              style={{
                background: tab === t.id ? '#1a56db' : '#1a1a1a',
                color: tab === t.id ? '#fff' : '#888',
                border: `1px solid ${tab === t.id ? '#1a56db' : '#222'}`,
              }}
            >
              {t.icon}
              {t.label}
              {t.count !== undefined && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold ml-1"
                  style={{ background: tab === t.id ? 'rgba(255,255,255,0.2)' : '#222', color: tab === t.id ? '#fff' : '#666' }}>
                  {fmt(t.count)}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* ── Overview Tab ── */}
            {tab === 'overview' && (
              <div className="space-y-5">
                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { label: 'Total Users', value: stats.users, icon: <Users className="w-4 h-4" />, color: '#1a56db' },
                    { label: 'Total Streams', value: stats.streams, icon: <Radio className="w-4 h-4" />, color: '#22c55e' },
                    { label: 'Live Now', value: stats.liveNow, icon: <Activity className="w-4 h-4" />, color: '#ef4444' },
                    { label: 'Total Posts', value: stats.posts, icon: <Eye className="w-4 h-4" />, color: '#f59e0b' },
                    { label: 'Feedback', value: stats.feedback, icon: <MessageSquare className="w-4 h-4" />, color: '#a78bfa' },
                  ].map(s => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                      <div className="flex items-center gap-2 mb-2" style={{ color: s.color }}>
                        {s.icon}
                        <span className="text-xs font-semibold" style={{ color: '#555' }}>{s.label}</span>
                      </div>
                      <p className="text-2xl font-black" style={{ color: '#e8e8e8' }}>{fmt(s.value)}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Recent users */}
                <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e1e' }}>
                    <h3 className="text-sm font-bold" style={{ color: '#e8e8e8' }}>Recent Users</h3>
                    <button onClick={() => setTab('users')} className="text-xs font-semibold" style={{ color: '#1a56db' }}>View All</button>
                  </div>
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <Avatar className="w-9 h-9 rounded-full">
                        <AvatarImage src={u.avatar_url || ''} />
                        <AvatarFallback style={{ background: '#1a1a1a', color: '#1a56db', fontWeight: 800 }}>
                          {u.display_name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#e8e8e8' }}>{u.display_name}</p>
                        <p className="text-xs" style={{ color: '#555' }}>@{u.username}</p>
                      </div>
                      <p className="text-xs" style={{ color: '#444' }}>{new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>

                {/* Live streams */}
                <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                  <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #1e1e1e' }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
                    <h3 className="text-sm font-bold" style={{ color: '#e8e8e8' }}>Live Streams</h3>
                  </div>
                  {streams.filter(s => s.is_live).length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm" style={{ color: '#555' }}>No live streams right now</p>
                    </div>
                  ) : streams.filter(s => s.is_live).map(s => (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded animate-pulse" style={{ background: '#ef4444', color: '#fff' }}>LIVE</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#e8e8e8' }}>{s.title}</p>
                        <p className="text-xs" style={{ color: '#555' }}>
                          {(s as any).profiles?.display_name || 'Unknown'} · {s.viewer_count} viewers
                        </p>
                      </div>
                      <button onClick={() => endStream(s.id)} className="text-xs font-bold px-3 py-1 rounded-lg hover:bg-red-500/20 transition-colors"
                        style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                        End
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Users Tab ── */}
            {tab === 'users' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#444' }} />
                  <input
                    className="w-full h-10 pl-10 pr-4 text-sm rounded-xl outline-none"
                    style={{ background: '#1a1a1a', border: '1px solid #222', color: '#e8e8e8' }}
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 text-xs font-bold" style={{ color: '#555', borderBottom: '1px solid #1e1e1e' }}>
                    <span>User</span>
                    <span>Joined</span>
                    <span>Actions</span>
                  </div>
                  {filteredUsers.map(u => (
                    <div key={u.id} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-3" style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="w-9 h-9 rounded-full shrink-0">
                          <AvatarImage src={u.avatar_url || ''} />
                          <AvatarFallback style={{ background: '#1a1a1a', color: '#1a56db', fontWeight: 800 }}>
                            {u.display_name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#e8e8e8' }}>{u.display_name}</p>
                          <p className="text-xs truncate" style={{ color: '#555' }}>@{u.username}</p>
                        </div>
                      </div>
                      <p className="text-xs shrink-0" style={{ color: '#444' }}>{new Date(u.created_at).toLocaleDateString()}</p>
                      <div className="flex gap-1 shrink-0">
                        <Link to={`/channel/${u.username}`}>
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors" title="View profile">
                            <Eye className="w-3.5 h-3.5" style={{ color: '#888' }} />
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-sm" style={{ color: '#555' }}>No users found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Streams Tab ── */}
            {tab === 'streams' && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e1e' }}>
                  <h3 className="text-sm font-bold" style={{ color: '#e8e8e8' }}>All Streams ({streams.length})</h3>
                </div>
                {streams.length === 0 ? (
                  <div className="py-12 text-center">
                    <Radio className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: '#1a56db' }} />
                    <p className="text-sm" style={{ color: '#555' }}>No streams yet</p>
                  </div>
                ) : streams.map(s => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #1a1a1a' }}>
                    {s.is_live ? (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded animate-pulse shrink-0" style={{ background: '#ef4444', color: '#fff' }}>LIVE</span>
                    ) : (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded shrink-0" style={{ background: '#222', color: '#555' }}>ENDED</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#e8e8e8' }}>{s.title}</p>
                      <p className="text-xs" style={{ color: '#555' }}>
                        {(s as any).profiles?.display_name || 'Unknown'} · {s.viewer_count} viewers · {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {s.is_live && (
                        <button onClick={() => endStream(s.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors" title="End stream">
                          <Ban className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      )}
                      <button onClick={() => deleteStream(s.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors" title="Delete stream">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Content Tab ── */}
            {tab === 'content' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Posts', value: stats.posts, color: '#1a56db' },
                    { label: 'Streams', value: stats.streams, color: '#22c55e' },
                    { label: 'Live Now', value: stats.liveNow, color: '#ef4444' },
                  ].map(s => (
                    <div key={s.label} className="p-4 rounded-2xl text-center" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                      <p className="text-2xl font-black" style={{ color: s.color }}>{fmt(s.value)}</p>
                      <p className="text-xs mt-1" style={{ color: '#555' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="p-8 rounded-2xl text-center" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                  <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: '#1a56db' }} />
                  <p className="font-bold" style={{ color: '#e8e8e8' }}>Content Analytics Coming Soon</p>
                  <p className="text-sm mt-1" style={{ color: '#555' }}>Detailed content moderation tools</p>
                </div>
              </div>
            )}

            {/* ── Feedback Tab ── */}
            {tab === 'feedback' && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1e1e1e' }}>
                  <h3 className="text-sm font-bold" style={{ color: '#e8e8e8' }}>User Feedback ({feedback.length})</h3>
                </div>
                {feedback.length === 0 ? (
                  <div className="py-12 text-center">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: '#1a56db' }} />
                    <p className="text-sm" style={{ color: '#555' }}>No feedback yet</p>
                  </div>
                ) : feedback.map(f => (
                  <div key={f.id} className="px-4 py-3" style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                            style={{
                              background: f.category === 'bug' ? 'rgba(239,68,68,0.15)' : f.category === 'feature' ? 'rgba(26,86,219,0.15)' : 'rgba(245,158,11,0.15)',
                              color: f.category === 'bug' ? '#ef4444' : f.category === 'feature' ? '#1a56db' : '#f59e0b',
                            }}>
                            {f.category}
                          </span>
                          <span className="text-xs" style={{ color: '#444' }}>
                            {'⭐'.repeat(f.rating)}
                          </span>
                          <span className="text-xs ml-auto" style={{ color: '#444' }}>{new Date(f.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm" style={{ color: '#ccc' }}>{f.message}</p>
                      </div>
                      <button onClick={() => deleteFeedback(f.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors shrink-0" title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
