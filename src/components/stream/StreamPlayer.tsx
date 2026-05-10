import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface Props {
  sourceType: 'youtube' | 'hls';
  sourceUrl: string | null | undefined;
  muted?: boolean;
  className?: string;
}

/** Extract YouTube video ID from URL or accept raw ID. */
function getYouTubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Already an ID (11 chars, alnum/-_)
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0] || null;
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    // /live/<id> or /embed/<id>
    const parts = u.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex(p => p === 'live' || p === 'embed' || p === 'shorts');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  } catch { /* ignore */ }
  return null;
}

export function StreamPlayer({ sourceType, sourceUrl, muted = true, className = '' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (sourceType !== 'hls' || !sourceUrl || !videoRef.current) return;
    const video = videoRef.current;
    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({ lowLatencyMode: true });
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = sourceUrl;
    }
    return () => { hls?.destroy(); };
  }, [sourceType, sourceUrl]);

  if (!sourceUrl) {
    return (
      <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black ${className}`}>
        <p className="text-muted-foreground text-sm">Stream source not configured</p>
      </div>
    );
  }

  if (sourceType === 'youtube') {
    const id = getYouTubeId(sourceUrl);
    if (!id) {
      return (
        <div className={`absolute inset-0 flex items-center justify-center bg-black ${className}`}>
          <p className="text-muted-foreground text-sm">Invalid YouTube URL</p>
        </div>
      );
    }
    const params = `autoplay=1&mute=${muted ? 1 : 0}&playsinline=1&rel=0&modestbranding=1`;
    return (
      <iframe
        title="YouTube live stream"
        src={`https://www.youtube.com/embed/${id}?${params}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className={`absolute inset-0 w-full h-full ${className}`}
        frameBorder={0}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted={muted}
      playsInline
      controls
      className={`absolute inset-0 w-full h-full bg-black object-contain ${className}`}
    />
  );
}
