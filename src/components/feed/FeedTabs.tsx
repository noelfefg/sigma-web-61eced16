import { motion } from 'framer-motion';

interface FeedTabsProps {
  active: string;
  onChange: (tab: string) => void;
}

const tabs = [
  { id: 'foryou', label: 'For you' },
  { id: 'following', label: 'Following' },
];

export function FeedTabs({ active, onChange }: FeedTabsProps) {
  return (
    <div className="flex border-b border-border/40 sticky top-14 z-10 bg-background/95 backdrop-blur-md">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="relative flex-1 py-4 text-[15px] font-bold transition-colors duration-200 hover:bg-accent/20"
        >
          <span className={active === tab.id ? 'text-foreground' : 'text-muted-foreground'}>
            {tab.label}
          </span>
          {active === tab.id && (
            <motion.div
              layoutId="feedTabIndicator"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-primary rounded-full"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
