import { motion } from 'framer-motion';

interface FeedTabsProps {
  active: string;
  onChange: (tab: string) => void;
}

const tabs = [
  { id: 'foryou', label: '🔥 For You' },
  { id: 'following', label: '👥 Following' },
  { id: 'trending', label: '📈 Trending' },
];

export function FeedTabs({ active, onChange }: FeedTabsProps) {
  return (
    <div className="flex gap-1 bg-secondary/40 backdrop-blur-sm rounded-2xl p-1 border border-border/30">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200"
        >
          {active === tab.id && (
            <motion.div
              layoutId="feedTab"
              className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/15 to-primary/10 rounded-xl border border-primary/20 shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className={`relative z-10 ${active === tab.id ? 'text-primary' : 'text-muted-foreground'}`}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
