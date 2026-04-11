import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Video, Eye, TrendingUp, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface StreamStat {
  id: string;
  title: string;
  viewer_count: number;
  created_at: string;
  is_live: boolean;
}

export function CreatorAnalytics() {
  const { user } = useAuth();
  const [streams, setStreams] = useState<StreamStat[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      const [{ data: streamsData }, { data: fc }, { data: posts }, { data: shorts }] = await Promise.all([
        supabase.from('streams').select('id, title, viewer_count, created_at, is_live').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20),
        supabase.rpc('get_follower_count', { profile_id: user!.id }),
        supabase.from('posts').select('id, view_count').eq('user_id', user!.id),
        supabase.from('shorts').select('id, view_count').eq('user_id', user!.id),
      ]);
      setStreams(streamsData || []);
      setFollowerCount(fc || 0);
      setPostCount((posts?.length || 0) + (shorts?.length || 0));
      const sv = (streamsData || []).reduce((a: number, s: any) => a + s.viewer_count, 0);
      const pv = (posts || []).reduce((a: number, p: any) => a + p.view_count, 0);
      const shv = (shorts || []).reduce((a: number, s: any) => a + s.view_count, 0);
      setTotalViews(sv + pv + shv);
      setLoading(false);
    }
    fetch();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const peakViewers = streams.length > 0 ? Math.max(...streams.map(s => s.viewer_count)) : 0;

  const stats = [
    { label: 'Followers', value: followerCount, icon: Users, color: 'text-primary' },
    { label: 'Total Views', value: totalViews, icon: Eye, color: 'text-emerald-500' },
    { label: 'Peak Viewers', value: peakViewers, icon: TrendingUp, color: 'text-amber-500' },
    { label: 'Content', value: postCount + streams.length, icon: Video, color: 'text-purple-500' },
  ];

  const chartData = streams.slice(0, 10).reverse().map(s => ({
    name: new Date(s.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    viewers: s.viewer_count,
  }));

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card border border-border/50 rounded-2xl p-4 space-y-1">
            <div className="flex items-center gap-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value.toLocaleString()}</p>
          </motion.div>
        ))}
      </div>

      {/* Viewers Chart */}
      {chartData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border/50 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Stream Viewers Over Time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="viewerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(215 15% 50%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(215 15% 50%)" />
              <Tooltip contentStyle={{ background: 'hsl(220 25% 8%)', border: '1px solid hsl(220 20% 13%)', borderRadius: '12px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="viewers" stroke="hsl(217 91% 60%)" strokeWidth={2} fill="url(#viewerGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Top Streams */}
      {streams.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card border border-border/50 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Top Streams</h3>
          <div className="space-y-2">
            {streams.slice(0, 5).map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/20 transition-colors">
                <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />{s.viewer_count}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
