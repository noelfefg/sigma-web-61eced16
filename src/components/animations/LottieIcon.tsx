import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

// ─── All animations fetched from LottieFiles CDN ──────────────────────────────
export const LOTTIE_URLS = {
  // Reactions & Social
  fire:           'https://assets10.lottiefiles.com/packages/lf20_t9gkkhz4.json',
  heart:          'https://assets9.lottiefiles.com/packages/lf20_qmfs6c3i.json',
  heartBeat:      'https://assets3.lottiefiles.com/packages/lf20_uu0x8lqv.json',
  thumbsUp:       'https://assets6.lottiefiles.com/packages/lf20_jR229r.json',
  clapping:       'https://assets10.lottiefiles.com/packages/lf20_obhph3t0.json',
  party:          'https://assets7.lottiefiles.com/packages/lf20_rovf9d5d.json',
  confetti:       'https://assets4.lottiefiles.com/packages/lf20_u4yrau84.json',
  star:           'https://assets2.lottiefiles.com/packages/lf20_ydo1amjm.json',
  stars:          'https://assets5.lottiefiles.com/packages/lf20_fcfjwiyb.json',
  trophy:         'https://assets1.lottiefiles.com/packages/lf20_touohxv0.json',
  medal:          'https://assets3.lottiefiles.com/packages/lf20_nkq3abxv.json',
  crown:          'https://assets9.lottiefiles.com/packages/lf20_zt9fnnls.json',
  rocket:         'https://assets6.lottiefiles.com/packages/lf20_ZSTH8o.json',
  lightning:      'https://assets2.lottiefiles.com/packages/lf20_syqnfe7c.json',
  // Streaming & Live
  liveStream:     'https://assets4.lottiefiles.com/packages/lf20_GofK09iPAB.json',
  broadcast:      'https://assets8.lottiefiles.com/packages/lf20_uwWgICKCxj.json',
  microphone:     'https://assets6.lottiefiles.com/packages/lf20_myxgs0mo.json',
  camera:         'https://assets5.lottiefiles.com/packages/lf20_s9fvkrh6.json',
  play:           'https://assets7.lottiefiles.com/packages/lf20_xlmz9xwm.json',
  signal:         'https://assets10.lottiefiles.com/packages/lf20_qwl4gi2d.json',
  wave:           'https://assets1.lottiefiles.com/packages/lf20_mWn6oT.json',
  // Navigation & UI
  search:         'https://assets2.lottiefiles.com/packages/lf20_yom6uvgj.json',
  notification:   'https://assets3.lottiefiles.com/packages/lf20_bd0RMI4s7Y.json',
  bell:           'https://assets5.lottiefiles.com/packages/lf20_T7jOaB.json',
  loading:        'https://assets4.lottiefiles.com/packages/lf20_x62chJ.json',
  loadingDots:    'https://assets7.lottiefiles.com/packages/lf20_kq5emira.json',
  checkmark:      'https://assets6.lottiefiles.com/packages/lf20_jbrw3hcz.json',
  success:        'https://assets9.lottiefiles.com/packages/lf20_lk80fpsm.json',
  send:           'https://assets10.lottiefiles.com/packages/lf20_u7bkFx.json',
  // People & Community
  people:         'https://assets1.lottiefiles.com/packages/lf20_slws5myf.json',
  team:           'https://assets5.lottiefiles.com/packages/lf20_w98ynlgu.json',
  handshake:      'https://assets8.lottiefiles.com/packages/lf20_w51pcehl.json',
  waving:         'https://assets2.lottiefiles.com/packages/lf20_cbrbre30.json',
  typing:         'https://assets4.lottiefiles.com/packages/lf20_2omg3bes.json',
  chat:           'https://assets1.lottiefiles.com/packages/lf20_3vbOcw.json',
  // Money & Wallet
  money:          'https://assets8.lottiefiles.com/packages/lf20_06a6pf9i.json',
  coin:           'https://assets2.lottiefiles.com/packages/lf20_tl52xzvn.json',
  wallet:         'https://assets5.lottiefiles.com/packages/lf20_hhei2syp.json',
  diamond:        'https://assets7.lottiefiles.com/packages/lf20_l4xztifn.json',
  // Status & Feedback
  empty:          'https://assets5.lottiefiles.com/packages/lf20_yzoqyyqf.json',
  emptyBox:       'https://assets4.lottiefiles.com/packages/lf20_wnqlfojb.json',
  offline:        'https://assets10.lottiefiles.com/packages/lf20_tnrzlN.json',
  wifi:           'https://assets8.lottiefiles.com/packages/lf20_ydom9gia.json',
  lock:           'https://assets6.lottiefiles.com/packages/lf20_pqnfmone.json',
  shield:         'https://assets9.lottiefiles.com/packages/lf20_qjlreio9.json',
  // Content & Media
  music:          'https://assets10.lottiefiles.com/packages/lf20_GofK09iPAB.json',
  headphones:     'https://assets2.lottiefiles.com/packages/lf20_xvmprwnw.json',
  gamepad:        'https://assets5.lottiefiles.com/packages/lf20_kkflmtur.json',
  art:            'https://assets7.lottiefiles.com/packages/lf20_uw0l8t6f.json',
  upload:         'https://assets3.lottiefiles.com/packages/lf20_pqnfmone.json',
  // Nature & Fun
  sun:            'https://assets8.lottiefiles.com/packages/lf20_xlkxtmul.json',
  moon:           'https://assets1.lottiefiles.com/packages/lf20_xo0ht03x.json',
  sparkle:        'https://assets2.lottiefiles.com/packages/lf20_ydo1amjm.json',
  explosion:      'https://assets7.lottiefiles.com/packages/lf20_rovf9d5d.json',
  celebration:    'https://assets8.lottiefiles.com/packages/lf20_obhph3t0.json',
  // Settings & Tools
  settings:       'https://assets2.lottiefiles.com/packages/lf20_yom6uvgj.json',
  edit:           'https://assets7.lottiefiles.com/packages/lf20_obhph3t0.json',
  refresh:        'https://assets9.lottiefiles.com/packages/lf20_x62chJ.json',
  share:          'https://assets1.lottiefiles.com/packages/lf20_u7bkFx.json',
  analytics:      'https://assets5.lottiefiles.com/packages/lf20_jR229r.json',
  growth:         'https://assets8.lottiefiles.com/packages/lf20_bd0RMI4s7Y.json',
  chart:          'https://assets1.lottiefiles.com/packages/lf20_qmfs6c3i.json',
} as const;

export type LottieKey = keyof typeof LOTTIE_URLS;

// Global cache so each animation JSON is only fetched once
const cache: Record<string, any> = {};
const pending: Record<string, Promise<any>> = {};

async function fetchLottie(url: string): Promise<any> {
  if (cache[url]) return cache[url];
  if (!pending[url]) {
    pending[url] = fetch(url).then(r => r.json()).then(d => { cache[url] = d; return d; });
  }
  return pending[url];
}

interface Props {
  name: LottieKey;
  size?: number;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
  speed?: number;
}

export function LottieIcon({ name, size = 48, loop = true, autoplay = true, className = '', style = {} }: Props) {
  const [data, setData] = useState<any>(cache[LOTTIE_URLS[name]] || null);

  useEffect(() => {
    let cancelled = false;
    fetchLottie(LOTTIE_URLS[name]).then(d => { if (!cancelled) setData(d); }).catch(() => {});
    return () => { cancelled = true; };
  }, [name]);

  if (!data) {
    // Placeholder shimmer while loading
    return (
      <div
        className={className}
        style={{ width: size, height: size, borderRadius: size / 4, background: 'rgba(255,255,255,0.04)', ...style }}
      />
    );
  }

  return (
    <Lottie
      animationData={data}
      loop={loop}
      autoplay={autoplay}
      style={{ width: size, height: size, ...style }}
      className={className}
    />
  );
}

// Convenience wrapper for AnimatedEmptyState pattern
export function LottieEmptyState({
  name, size = 160, title, description, action
}: { name: LottieKey; size?: number; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
      <LottieIcon name={name} size={size} loop autoplay />
      <p style={{ color: '#e8e8e8', fontWeight: 700, fontSize: 16, marginTop: 8, marginBottom: 4 }}>{title}</p>
      {description && <p style={{ color: '#555', fontSize: 13, maxWidth: 280, lineHeight: 1.6 }}>{description}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
