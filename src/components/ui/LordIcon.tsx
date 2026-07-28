/* ─────────────────────────────────────────────────────────────────
   LordIcon — animated icons from lordicon.com (Iconscout)
   CDN: https://cdn.lordicon.com/{id}.json
   ───────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        trigger?: 'hover' | 'click' | 'loop' | 'loop-on-hover' | 'morph' | 'morph-two-way' | 'in' | 'boomerang';
        colors?: string;
        style?: React.CSSProperties;
        target?: string;
        delay?: string | number;
        stroke?: string;
        state?: string;
      };
    }
  }
}

interface LordIconProps {
  icon: string;          // icon ID e.g. "kbtmbyzy"
  size?: number;
  trigger?: 'hover' | 'click' | 'loop' | 'loop-on-hover' | 'morph' | 'boomerang' | 'in';
  primary?: string;      // hex color without #
  secondary?: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  target?: string;       // CSS selector — hover on parent triggers animation
}

export function LordIcon({
  icon,
  size = 28,
  trigger = 'hover',
  primary = '00e5ff',
  secondary = 'ffffff',
  className = '',
  style = {},
  delay,
  target,
}: LordIconProps) {
  return (
    <lord-icon
      src={`https://cdn.lordicon.com/${icon}.json`}
      trigger={trigger}
      colors={`primary:#${primary},secondary:#${secondary}`}
      target={target}
      delay={delay}
      style={{ width: size, height: size, flexShrink: 0, ...style }}
      className={className}
    />
  );
}

/* ── Pre-configured icon shortcuts ──────────────────────────────── */

// Catalog of icon IDs from lordicon.com free library
export const ICONS = {
  // Navigation
  home:        'cnbvjizf',
  search:      'msoeawqm',
  compass:     'tkgyrmto',
  following:   'oalqaQPi',
  // Content
  play:        'becqpmtb',
  video:       'jeuxydnh',
  camera:      'nqtddebt',
  shorts:      'pqiakntj',
  image:       'lltsvkvf',
  // Social
  heart:       'kbtmbyzy',
  fire:        'liavitpd',
  star:        'iltqorsz',
  trophy:      'jtiihjkj',
  crown:       'dxoycpzg',
  medal:       'hpivxauj',
  users:       'hjkpvjkq',
  user:        'bgebyztm',
  // Communication
  bell:        'tdrtiskw',
  chat:        'prjooket',
  mail:        'aycinego',
  send:        'whtttcqn',
  message:     'orikpnvx',
  // Actions
  like:        'kbtmbyzy',
  bookmark:    'wkwbxkyk',
  share:       'mwikjdwh',
  upload:      'wbdxqmca',
  plus:        'kkvxgpti',
  check:       'oqIPTsIL',
  trash:       'iHBVptop',
  edit:        'iBjrpCih',
  copy:        'depehmqe',
  // Interface
  settings:    'hwhjxbfb',
  lock:        'PBQJQJRA',
  eye:         'nhfxhimi',
  filter:      'wiprbzkv',
  menu:        'lqgwlnyn',
  // Stats/Growth
  chart:       'fihkmkwg',
  rocket:      'lqgwlnyn',
  lightning:   'mrdiizbh',
  trending:    'obnfocim',
  // Misc
  globe:       'lzgmgrnn',
  music:       'xcrjfuzb',
  mic:         'mkrfenbb',
  diamond:     'ewDfCJHv',
  coin:        'yhqQDVXS',
  sparkle:     'hqymkahc',
  confetti:    'kbkbkbkb',
  loading:     'dycatgpp',
  warning:     'vyukcaVR',
  error:       'tdhhwuhv',
  success:     'oqIPTsIL',
  question:    'LMvxmacu',
  info:        'wqjbiifi',
  live:        'vdcaolfb',
  stream:      'vdcaolfb',
  friends:     'hjkpvjkq',
  rankings:    'jtiihjkj',
  studio:      'fihkmkwg',
  feedback:    'prjooket',
  reactions:   'kbtmbyzy',
  wave:        'ajbomehd',
  palette:     'hqymkahc',
  zap:         'mrdiizbh',
  shield:      'PBQJQJRA',
} as const;

export type IconName = keyof typeof ICONS;

/* ── Page-level hero icon ─────────────────────────────────────────── */
export function PageIcon({ name, size=48, trigger='in', primary='00e5ff', secondary='ffffff' }: {
  name: IconName; size?: number; trigger?: LordIconProps['trigger']; primary?: string; secondary?: string;
}) {
  return <LordIcon icon={ICONS[name]} size={size} trigger={trigger} primary={primary} secondary={secondary} />;
}
