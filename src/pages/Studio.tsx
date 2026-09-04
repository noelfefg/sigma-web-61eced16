import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, MessageSquare, Radio, Users, Loader2 } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, RadialBar, RadialBarChart, PolarGrid } from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlassCard } from '@/components/sigma/GlassCard';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useStreamMetricSeries } from '@/hooks/useStreamMetrics';

interface OwnStream {
  id: string;
  title: string;
  is_live: boolean;
  viewer_count: number;
  created_at: string;
}

const chartConfig = {
  viewer_count: { label: 'Viewers', color: 'hsl(var(--foreground))' },
  chat_count: { label: 'Chat', color: 'hsl(var(--muted-foreground))' },
} satisfies ChartConfig;

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <GlassCard className="flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-bold tabular-nums">{value}</p>
      </div>
    </GlassCard>
  );
}

export default function StudioPage() {
  const { user } = useAuth();
  const [streams, setStreams] = useState<OwnStream[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sigmatizers, setSigmatizers] = useState(0);
  const [chatTotal, setChatTotal] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: own }, { data: followers }] = await Promise.all([
        supabase
          .from('streams')
          .select('id, title, is_live, viewer_count, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.rpc('get_follower_count', { profile_id: user.id }),
      ]);
      if (cancelled) return;
      const list = own ?? [];
      setStreams(list);
      setSelected(list[0]?.id ?? null);
      setSigmatizers(followers ?? 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!selected) {
      setChatTotal(0);
      return;
    }
    supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('stream_id', selected)
      .then(({ count }) => setChatTotal(count ?? 0));
  }, [selected]);

  const { samples, loading: samplesLoading } = useStreamMetricSeries(selected);

  const series = useMemo(
    () =>
      samples.map((s) => ({
        time: new Date(s.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        viewer_count: s.viewer_count,
        chat_count: s.chat_count,
      })),
    [samples],
  );

  const peak = samples.reduce((m, s) => Math.max(m, s.viewer_count), 0);
  const current = streams.find((s) => s.id === selected);

  const radial = [
    {
      name: 'engagement',
      value: peak > 0 ? Math.min(100, Math.round((chatTotal / Math.max(peak, 1)) * 100)) : 0,
      fill: 'hsl(var(--foreground))',
    },
  ];

  if (!user) return null;

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1200px] space-y-6 px-3 py-5 md:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tight">Creator studio</h1>
            <p className="text-xs text-muted-foreground">Real numbers recorded while you were live.</p>
          </div>
          <div className="flex items-center gap-2">
            {streams.length > 0 && (
              <Select value={selected ?? undefined} onValueChange={setSelected}>
                <SelectTrigger className="h-9 w-[220px] rounded-full text-xs">
                  <SelectValue placeholder="Select a broadcast" />
                </SelectTrigger>
                <SelectContent>
                  {streams.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Link to="/go-live">
              <Button size="sm" className="h-9 rounded-full text-xs font-semibold">
                <Radio className="mr-1.5 h-3.5 w-3.5" />
                Go live
              </Button>
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : streams.length === 0 ? (
          <GlassCard className="px-6 py-16 text-center">
            <Activity className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-semibold">No broadcasts yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Analytics appear here once you have gone live.</p>
          </GlassCard>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Users} label="Sigmatizers" value={sigmatizers.toString()} />
              <StatCard icon={Activity} label="Peak viewers" value={peak.toString()} />
              <StatCard icon={MessageSquare} label="Chat messages" value={chatTotal.toString()} />
              <StatCard icon={Radio} label="Status" value={current?.is_live ? 'Live' : 'Offline'} />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <GlassCard className="p-4 lg:col-span-2">
                <h2 className="mb-3 text-sm font-bold">Audience over time</h2>
                {samplesLoading ? (
                  <div className="flex h-56 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : series.length === 0 ? (
                  <p className="flex h-56 items-center justify-center text-center text-xs text-muted-foreground">
                    No samples recorded for this broadcast yet.
                  </p>
                ) : (
                  <ChartContainer config={chartConfig} className="h-56 w-full">
                    <AreaChart data={series} margin={{ left: 4, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} strokeOpacity={0.12} />
                      <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                      <YAxis tickLine={false} axisLine={false} width={28} fontSize={11} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        dataKey="viewer_count"
                        type="monotone"
                        stroke="var(--color-viewer_count)"
                        fill="var(--color-viewer_count)"
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                      <Area
                        dataKey="chat_count"
                        type="monotone"
                        stroke="var(--color-chat_count)"
                        fill="var(--color-chat_count)"
                        fillOpacity={0.08}
                        strokeWidth={1.5}
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
              </GlassCard>

              <GlassCard className="p-4">
                <h2 className="mb-3 text-sm font-bold">Chat per peak viewer</h2>
                <ChartContainer config={chartConfig} className="mx-auto h-56 w-full">
                  <RadialBarChart data={radial} innerRadius="65%" outerRadius="100%" startAngle={90} endAngle={-270}>
                    <PolarGrid gridType="circle" radialLines={false} stroke="none" />
                    <RadialBar dataKey="value" background cornerRadius={12} />
                  </RadialBarChart>
                </ChartContainer>
                <p className="text-center text-xs text-muted-foreground">
                  {radial[0].value}% engagement based on recorded data
                </p>
              </GlassCard>
            </div>

            <GlassCard className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Broadcast</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-28 text-right">Viewers</TableHead>
                    <TableHead className="w-40 text-right">Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {streams.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelected(s.id)}>
                      <TableCell className="font-medium">{s.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.is_live ? 'Live' : 'Ended'}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.viewer_count}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </GlassCard>
          </>
        )}
      </div>
    </AppLayout>
  );
}
