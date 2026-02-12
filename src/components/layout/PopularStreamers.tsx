import { User, Radio } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const popularStreamers = [
  { name: 'ProGamer99', viewers: '4.2K', live: true, color: 'from-red-500 to-pink-500' },
  { name: 'ArtMaster', viewers: '1.8K', live: true, color: 'from-purple-500 to-indigo-500' },
  { name: 'CodeStream', viewers: '956', live: true, color: 'from-cyan-400 to-blue-500' },
  { name: 'MusicVibes', viewers: '2.1K', live: false, color: 'from-amber-400 to-orange-500' },
  { name: 'TechTalks', viewers: '723', live: false, color: 'from-green-400 to-emerald-500' },
];

interface PopularStreamersProps {
  collapsed: boolean;
}

export function PopularStreamers({ collapsed }: PopularStreamersProps) {
  return (
    <div className="space-y-1.5">
      {!collapsed && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-2">
          Popular Streamers
        </p>
      )}
      {popularStreamers.map(s => (
        <button
          key={s.name}
          className={`flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all duration-200 group ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="relative shrink-0">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${s.color} p-[1.5px]`}>
              <Avatar className="w-full h-full border-[1.5px] border-card">
                <AvatarFallback className="bg-secondary text-[10px]">
                  <User className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
            </div>
            {s.live && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-destructive rounded-full border-[1.5px] border-card flex items-center justify-center">
                <Radio className="w-1.5 h-1.5 text-white" />
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold truncate">{s.name}</p>
              <p className="text-[10px] text-muted-foreground/70">
                {s.live ? (
                  <span className="text-destructive font-medium">{s.viewers} watching</span>
                ) : (
                  <span>Offline</span>
                )}
              </p>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
