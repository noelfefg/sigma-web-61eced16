import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const backgrounds = [
  { id: 'none', label: 'None' },
  { id: 'aurora', label: 'Aurora' },
  { id: 'particles', label: 'Particles' },
  { id: 'gradient-wave', label: 'Gradient Wave' },
  { id: 'starfield', label: 'Starfield' },
  { id: 'mesh', label: 'Mesh' },
];

export function useLiveBackground() {
  const [bg, setBg] = useState(() => localStorage.getItem('live-bg') || 'none');

  useEffect(() => {
    localStorage.setItem('live-bg', bg);
  }, [bg]);

  return { bg, setBg, backgrounds };
}

export function LiveBackground({ variant }: { variant: string }) {
  if (variant === 'none') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {variant === 'aurora' && <AuroraBackground />}
      {variant === 'particles' && <ParticlesBackground />}
      {variant === 'gradient-wave' && <GradientWaveBackground />}
      {variant === 'starfield' && <StarfieldBackground />}
      {variant === 'mesh' && <MeshBackground />}
    </div>
  );
}

function AuroraBackground() {
  return (
    <div className="absolute inset-0">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-15 blur-[120px]"
        style={{ background: 'hsl(var(--primary))' }}
        animate={{
          x: ['-20%', '60%', '20%', '-20%'],
          y: ['-10%', '30%', '70%', '-10%'],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-10 blur-[100px]"
        style={{ background: 'hsl(280 80% 60%)' }}
        animate={{
          x: ['80%', '10%', '50%', '80%'],
          y: ['60%', '-10%', '40%', '60%'],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-[80px]"
        style={{ background: 'hsl(160 70% 50%)' }}
        animate={{
          x: ['30%', '70%', '-10%', '30%'],
          y: ['80%', '20%', '50%', '80%'],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function ParticlesBackground() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 15 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -200, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function GradientWaveBackground() {
  return (
    <div className="absolute inset-0">
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[50vh] opacity-10"
        style={{
          background: 'linear-gradient(180deg, transparent, hsl(var(--primary) / 0.3))',
          borderRadius: '100% 100% 0 0',
        }}
        animate={{
          scaleX: [1, 1.2, 0.9, 1],
          scaleY: [1, 0.8, 1.1, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[40vh] opacity-8"
        style={{
          background: 'linear-gradient(180deg, transparent, hsl(280 60% 50% / 0.2))',
          borderRadius: '100% 100% 0 0',
        }}
        animate={{
          scaleX: [1.1, 0.9, 1.15, 1.1],
          scaleY: [0.9, 1.1, 0.85, 0.9],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function StarfieldBackground() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    twinkleDuration: Math.random() * 3 + 2,
    delay: Math.random() * 3,
  }));

  return (
    <div className="absolute inset-0">
      {stars.map(s => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-foreground/30"
          style={{
            width: s.size,
            height: s.size,
            left: `${s.x}%`,
            top: `${s.y}%`,
          }}
          animate={{ opacity: [0.1, 0.6, 0.1] }}
          transition={{
            duration: s.twinkleDuration,
            repeat: Infinity,
            delay: s.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function MeshBackground() {
  return (
    <div className="absolute inset-0">
      <motion.div
        className="absolute inset-0 opacity-8"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, hsl(280 60% 50% / 0.12) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, hsl(160 60% 50% / 0.08) 0%, transparent 50%)
          `,
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-5 blur-[150px]"
        style={{ background: 'hsl(var(--primary))' }}
        animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
