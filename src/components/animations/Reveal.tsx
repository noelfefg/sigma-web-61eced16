import { motion, useInView, Variants } from 'framer-motion';
import { useRef, ReactNode } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'scale' | 'blur';

interface RevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  amount?: number;
}

const variantsFor = (direction: Direction): Variants => {
  const distance = 40;
  switch (direction) {
    case 'down':
      return { hidden: { opacity: 0, y: -distance }, show: { opacity: 1, y: 0 } };
    case 'left':
      return { hidden: { opacity: 0, x: -distance }, show: { opacity: 1, x: 0 } };
    case 'right':
      return { hidden: { opacity: 0, x: distance }, show: { opacity: 1, x: 0 } };
    case 'scale':
      return { hidden: { opacity: 0, scale: 0.92 }, show: { opacity: 1, scale: 1 } };
    case 'blur':
      return {
        hidden: { opacity: 0, filter: 'blur(14px)', y: 20 },
        show: { opacity: 1, filter: 'blur(0px)', y: 0 },
      };
    case 'up':
    default:
      return { hidden: { opacity: 0, y: distance }, show: { opacity: 1, y: 0 } };
  }
};

export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.7,
  className = '',
  once = true,
  amount = 0.2,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, amount });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={variantsFor(direction)}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerWordsProps {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
}

export function StaggerWords({
  text,
  className = '',
  wordClassName = '',
  delay = 0,
  stagger = 0.08,
}: StaggerWordsProps) {
  const words = text.split(' ');
  return (
    <motion.span
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      className={className}
      style={{ display: 'inline-block' }}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: '100%', filter: 'blur(8px)' },
            show: { opacity: 1, y: '0%', filter: 'blur(0px)' },
          }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={wordClassName}
          style={{ display: 'inline-block', marginRight: '0.25em', overflow: 'hidden' }}
        >
          {w}
        </motion.span>
      ))}
    </motion.span>
  );
}
