import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type StreamEventType = 'join' | 'leave' | 'chat' | 'reaction' | 'share' | 'poll_vote';

export interface MetricSample {
  captured_at: string;
  viewer_count: number;
  chat_count: number;
  reaction_count: number;
  like_count: number;
}

/** Logs a real interaction event for a stream. No-op when signed out. */
export function useStreamEventLogger(streamId?: string | null) {
  return useCallback(
    async (eventType: StreamEventType, weight = 1) => {
      if (!streamId) return;
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;
      await supabase.from('stream_events').insert({
        stream_id: streamId,
        user_id: uid,
        event_type: eventType,
        weight,
      });
    },
    [streamId],
  );
}

/**
 * Records periodic metric snapshots while the signed-in user owns the stream.
 * Only the owner is allowed to write samples, so this is a no-op for viewers.
 */
export function useStreamMetricRecorder({
  streamId,
  isOwner,
  active,
  viewerCount,
  intervalMs = 60_000,
}: {
  streamId?: string | null;
  isOwner: boolean;
  active: boolean;
  viewerCount: number;
  intervalMs?: number;
}) {
  const viewerRef = useRef(viewerCount);
  viewerRef.current = viewerCount;

  useEffect(() => {
    if (!streamId || !isOwner || !active) return;
    let cancelled = false;

    const capture = async () => {
      const since = new Date(Date.now() - intervalMs).toISOString();
      const [{ count: chatCount }, { count: reactionCount }] = await Promise.all([
        supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('stream_id', streamId)
          .gte('created_at', since),
        supabase
          .from('stream_events')
          .select('id', { count: 'exact', head: true })
          .eq('stream_id', streamId)
          .eq('event_type', 'reaction')
          .gte('created_at', since),
      ]);
      if (cancelled) return;
      await supabase.from('stream_metric_samples').insert({
        stream_id: streamId,
        viewer_count: viewerRef.current,
        chat_count: chatCount ?? 0,
        reaction_count: reactionCount ?? 0,
      });
    };

    const id = window.setInterval(capture, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [streamId, isOwner, active, intervalMs]);
}

/** Reads recorded samples for a stream. Returns an empty series when nothing was captured. */
export function useStreamMetricSeries(streamId?: string | null) {
  const [samples, setSamples] = useState<MetricSample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!streamId) {
      setSamples([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('stream_metric_samples')
      .select('captured_at, viewer_count, chat_count, reaction_count, like_count')
      .eq('stream_id', streamId)
      .order('captured_at', { ascending: true })
      .limit(500)
      .then(({ data }) => {
        if (cancelled) return;
        setSamples((data as MetricSample[]) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [streamId]);

  return { samples, loading };
}
