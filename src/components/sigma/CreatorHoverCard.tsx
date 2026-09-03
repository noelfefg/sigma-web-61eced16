import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { OrbitalAvatar } from '@/components/sigma/OrbitalAvatar';
import { SigmaBadge } from '@/components/common/SigmaBadge';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { SigmaUser } from '@/types/sigma';

interface Preview {
  bio: string | null;
  sigmatizers: number;
  live: boolean;
}

/** Desktop hover preview for a creator. Loads real profile data on first open. */
export function CreatorHoverCard({ user, children }: { user: SigmaUser; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    if (!open || preview || !user.id) return;
    let cancelled = false;
    (async () => {
      const [{ data: profile }, { data: count }, { data: stream }] = await Promise.all([
        supabase.from('profiles').select('bio').eq('id', user.id!).maybeSingle(),
        supabase.rpc('get_follower_count', { profile_id: user.id! }),
        supabase.from('streams').select('id').eq('user_id', user.id!).eq('is_live', true).maybeSingle(),
      ]);
      if (cancelled) return;
      setPreview({ bio: profile?.bio ?? null, sigmatizers: count ?? 0, live: !!stream });
    })();
    return () => {
      cancelled = true;
    };
  }, [open, preview, user.id]);

  return (
    <HoverCard openDelay={250} closeDelay={100} onOpenChange={setOpen}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-72 rounded-2xl border-border bg-card/95 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <OrbitalAvatar user={user} size="md" live={preview?.live} />
          <div className="min-w-0 flex-1">
            <Link to={`/channel/${user.username}`} className="block truncate text-sm font-semibold hover:underline">
              {user.display_name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
            {preview?.live && <SigmaBadge kind="live" className="mt-1.5" />}
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          {preview ? (
            <>
              {preview.bio && <p className="line-clamp-3 text-xs text-muted-foreground">{preview.bio}</p>}
              <p className="text-xs font-medium text-foreground">
                {preview.sigmatizers} <span className="font-normal text-muted-foreground">Sigmatizers</span>
              </p>
            </>
          ) : (
            <>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
