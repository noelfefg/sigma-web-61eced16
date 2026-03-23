import { useState } from 'react';
import { motion } from 'framer-motion';
import { LottieIcon, LottieKey } from './LottieIcon';

interface Props {
  icon: LottieKey;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  iconSize?: number;
  className?: string;
}

export function AnimatedButton({ icon, label, onClick, variant = 'primary', size = 'md', iconSize = 28, className = '' }: Props) {
  const [playing, setPlaying] = useState(false);

  const padding = { sm: '6px 14px', md: '10px 20px', lg: '14px 28px' }[size];
  const fontSize = { sm: 12, md: 14, lg: 16 }[size];

  const bg = variant === 'primary' ? '#1a56db' : variant === 'outline' ? 'transparent' : 'rgba(255,255,255,0.06)';
  const color = variant === 'primary' ? '#000' : '#fff';
  const border = variant === 'outline' ? '1.5px solid rgba(255,255,255,0.15)' : 'none';

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => { setPlaying(true); setTimeout(() => setPlaying(false), 1200); onClick?.(); }}
      style={{ background: bg, color, border, padding, borderRadius: 10, fontWeight: 700, fontSize, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
      className={className}
    >
      <LottieIcon name={icon} size={iconSize} loop={playing} autoplay={playing} />
      {label}
    </motion.button>
  );
}
