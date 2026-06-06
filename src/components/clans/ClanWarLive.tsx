/**
 * ClanWarLive — live scoreboard for a clan war.
 * Subscribes to the Go server's war:{id} Socket.IO room.
 * Falls back to a periodic Supabase query when VITE_GO_API_URL is unset.
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Icon, SIGMA_ICONS } from "@/components/ui/Icon";
import { getSocket } from "@/lib/socket";
import { supabase } from "@/integrations/supabase/client";

interface ScorePayload {
  scoreA: number;
  scoreB: number;
  endsAt?: string;
}

export interface ClanWarLiveProps {
  warId: string;
  clanAName: string;
  clanBName: string;
}

export function ClanWarLive({ warId, clanAName, clanBName }: ClanWarLiveProps) {
  const [score, setScore] = useState<ScorePayload>({ scoreA: 0, scoreB: 0 });
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Live socket subscription
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      const socket = await getSocket();
      if (!socket) return;
      socket.emit("join", `war:${warId}`);
      const handler = (p: ScorePayload) => setScore(p);
      socket.on("war:score", handler);
      cleanup = () => {
        socket.emit("leave", `war:${warId}`);
        socket.off("war:score", handler);
      };
    })();
    return () => cleanup?.();
  }, [warId]);

  // Fallback: poll Supabase aggregates
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const { data } = await (supabase as any)
        .from("clan_war_gifts")
        .select("clan_id, coin_value")
        .eq("war_id", warId);
      if (!alive || !data) return;
      const totals = (data as Array<{ clan_id: string; coin_value: number }>).reduce<
        Record<string, number>
      >((acc, r) => ((acc[r.clan_id] = (acc[r.clan_id] ?? 0) + r.coin_value), acc), {});
      const keys = Object.keys(totals);
      setScore({ scoreA: totals[keys[0]] ?? 0, scoreB: totals[keys[1]] ?? 0 });
    };
    tick();
    const i = setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(i);
    };
  }, [warId]);

  // Countdown
  useEffect(() => {
    if (!score.endsAt) return;
    const end = new Date(score.endsAt).getTime();
    const i = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(i);
  }, [score.endsAt]);

  const total = score.scoreA + score.scoreB || 1;
  const pctA = (score.scoreA / total) * 100;

  return (
    <Card className="cosmic-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 font-cosmic">
          <Icon icon={SIGMA_ICONS.war} size={22} className="text-destructive" />
          Clan War
        </CardTitle>
        {secondsLeft !== null && (
          <span className="text-sm tabular-nums text-muted-foreground">
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{clanAName}</span>
          <span className="font-medium">{clanBName}</span>
        </div>
        <div className="relative h-4 rounded-full bg-muted overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 cosmic-gradient transition-all duration-500"
            style={{ width: `${pctA}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xl font-cosmic tabular-nums">
          <span className="text-primary">{score.scoreA.toLocaleString()}</span>
          <span className="text-accent">{score.scoreB.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
