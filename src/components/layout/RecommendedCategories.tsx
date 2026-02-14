import { Gamepad2, MessageCircle, Music, Code, Palette } from 'lucide-react';

const categories = [
  { name: 'Just Chatting', icon: MessageCircle, viewers: '224K', tags: ['IRL'], color: 'from-yellow-500 to-orange-500' },
  { name: 'Fortnite', icon: Gamepad2, viewers: '18.2K', tags: ['FPS', 'Shooter'], color: 'from-blue-500 to-cyan-400' },
  { name: 'Minecraft', icon: Gamepad2, viewers: '13.9K', tags: ['Simulation'], color: 'from-green-500 to-emerald-400' },
  { name: 'Music', icon: Music, viewers: '8.4K', tags: ['Creative'], color: 'from-pink-500 to-rose-400' },
  { name: 'Art', icon: Palette, viewers: '5.1K', tags: ['Creative'], color: 'from-purple-500 to-violet-400' },
  { name: 'Software Dev', icon: Code, viewers: '3.7K', tags: ['Educational'], color: 'from-indigo-500 to-blue-400' },
];

interface RecommendedCategoriesProps {
  collapsed: boolean;
}

export function RecommendedCategories({ collapsed }: RecommendedCategoriesProps) {
  if (collapsed) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-2">
        Recommended Categories
      </p>
      {categories.map((cat) => (
        <button
          key={cat.name}
          className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-muted-foreground hover:bg-accent/50 hover:text-foreground group"
        >
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center shrink-0`}>
            <cat.icon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold truncate">{cat.name}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-destructive rounded-full" />
              <span className="text-[10px] text-destructive font-medium">{cat.viewers}</span>
              {cat.tags.map(tag => (
                <span key={tag} className="text-[9px] text-muted-foreground/70 bg-secondary/80 px-1.5 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        </button>
      ))}
      <button className="text-[11px] font-semibold text-primary hover:text-primary/80 px-3 py-1 transition-colors">
        Show More
      </button>
    </div>
  );
}
