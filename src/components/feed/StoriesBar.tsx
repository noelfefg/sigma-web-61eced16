import { Plus, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const mockStories = [
  { id: 'yours', name: 'Your Story', avatar: '', isYou: true },
  { id: '1', name: 'alex_dev', avatar: '' },
  { id: '2', name: 'sarah_art', avatar: '' },
  { id: '3', name: 'mike_live', avatar: '' },
  { id: '4', name: 'jess_play', avatar: '' },
  { id: '5', name: 'tom_code', avatar: '' },
];

export function StoriesBar() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 px-1 scrollbar-hide">
      {mockStories.map(story => (
        <button key={story.id} className="flex flex-col items-center gap-1.5 shrink-0 group">
          <div className={`w-16 h-16 rounded-full p-[2.5px] ${story.isYou ? 'bg-border' : 'bg-gradient-to-br from-primary via-destructive to-accent-foreground'}`}>
            <div className="w-full h-full rounded-full bg-card p-[2px]">
              <Avatar className="w-full h-full">
                <AvatarImage src={story.avatar} />
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  {story.isYou ? <Plus className="w-5 h-5 text-primary" /> : <User className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground truncate w-16 text-center group-hover:text-foreground transition-colors">
            {story.name}
          </span>
        </button>
      ))}
    </div>
  );
}
