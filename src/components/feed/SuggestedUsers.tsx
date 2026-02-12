import { User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const suggested = [
  { name: 'epic_gamer', display: 'Epic Gamer', followers: '12.4K', color: 'from-pink-500 to-rose-500' },
  { name: 'art_wizard', display: 'Art Wizard', followers: '8.7K', color: 'from-purple-500 to-indigo-500' },
  { name: 'code_ninja', display: 'Code Ninja', followers: '23.1K', color: 'from-cyan-500 to-blue-500' },
];

export function SuggestedUsers() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-card via-card to-primary/5 rounded-3xl border border-border/40 p-5 space-y-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Suggested for you</h3>
        <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">See All</button>
      </div>
      <div className="space-y-3">
        {suggested.map((u, i) => (
          <motion.div
            key={u.name}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${u.color} p-[2px] shrink-0`}>
              <Avatar className="w-full h-full border-2 border-card">
                <AvatarFallback className="bg-secondary text-xs">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{u.display}</p>
              <p className="text-[11px] text-muted-foreground">{u.followers} followers</p>
            </div>
            <Button size="sm" className="rounded-full text-xs h-7 px-4 bg-gradient-to-r from-primary to-primary/70 hover:from-primary/90 hover:to-primary/60 shadow-sm shadow-primary/20">
              Follow
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
