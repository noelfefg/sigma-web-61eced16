import { motion } from 'framer-motion';
import { LottieIcon, LottieKey } from './LottieIcon';

interface Props {
  animation: LottieKey;
  title: string;
  description?: string;
  size?: number;
  action?: React.ReactNode;
}

export function AnimatedEmptyState({ animation, title, description, size = 160, action }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}
    >
      <LottieIcon name={animation} size={size} loop autoplay />
      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 17, marginTop: 12, marginBottom: 6 }}>{title}</h3>
      {description && <p style={{ color: '#666', fontSize: 13, maxWidth: 280, lineHeight: 1.5 }}>{description}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </motion.div>
  );
}
