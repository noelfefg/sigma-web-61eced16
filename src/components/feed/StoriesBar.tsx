import { Plus, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const mockStories = [
  { id: 'yours', name: 'Your Story', avatar: '', isYou: true },
  { id: '1', name: 'alex_dev', avatar: '', color: 'from-pink-500 via-red-500 to-yellow-500' },
  { id: '2', name: 'sarah_art', avatar: '', color: 'from-purple-500 via-blue-500 to-cyan-400' },
  { id: '3', name: 'mike_live', avatar: '', color: 'from-green-400 via-emerald-500 to-teal-500' },
  { id: '4', name: 'jess_play', avatar: '', color: 'from-amber-400 via-orange-500 to-red-500' },
  { id: '5', name: 'tom_code', avatar: '', color: 'from-indigo-500 via-purple-500 to-pink-500' },
  { id: '6', name: 'luna_fx', avatar: '', color: 'from-cyan-400 via-blue-500 to-indigo-600' },
];

export function StoriesBar() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-3 px-1 scrollbar-hide">
      {mockStories.map((story, i) => (
        <motion.button
          key={story.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
          className="flex flex-col items-center gap-1.5 shrink-0 group"
        >
          <div className={`w-[68px] h-[68px] rounded-full p-[3px] transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${
            story.isYou
              ? 'bg-border'
              : `bg-gradient-to-br ${story.color || 'from-primary via-destructive to-accent-foreground'} shadow-md`
          }`}>
            <div className="w-full h-full rounded-full bg-card p-[2px]">
              <Avatar className="w-full h-full">
                <AvatarImage src={story.avatar} />
                <AvatarFallback className={`text-xs ${story.isYou ? 'bg-primary/10' : 'bg-gradient-to-br from-secondary to-secondary/50'}`}>
                  {story.isYou ? <Plus className="w-5 h-5 text-primary" /> : <User className="w-4 h-4 text-muted-foreground" />}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground truncate w-16 text-center group-hover:text-foreground transition-colors font-medium">
            {story.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
