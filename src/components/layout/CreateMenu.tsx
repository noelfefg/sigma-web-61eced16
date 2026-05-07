import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ImageIcon, Video, Play, Radio, UsersRound, Hash, UserPlus, Camera, Gift, Trophy, ShoppingBag, Tv, MessageSquareHeart, Flag, Feather } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const createOptions = [
  { icon: ImageIcon, label: 'Post', description: 'Share a photo or text', path: '/feed' },
  { icon: Video, label: 'Video', description: 'Upload a video', path: '/feed' },
  { icon: Play, label: 'Lil Vid', description: 'Create a short clip', path: '/shorts' },
  { icon: Radio, label: 'Go Live', description: 'Start streaming', path: '/go-live' },
];

const moreOptions = [
  { icon: UsersRound, label: 'Community', path: '/community' },
  { icon: Hash, label: 'Chat Rooms', path: '/chat' },
  { icon: UserPlus, label: 'Friends', path: '/friends' },
  { icon: Camera, label: 'Sigma Cam', path: '/camera' },
  { icon: Gift, label: 'Gifts', path: '/gifts' },
  { icon: Trophy, label: 'Rankings', path: '/rankings' },
  { icon: ShoppingBag, label: 'Store', path: '/store' },
  { icon: Tv, label: 'Creator Studio', path: '/studio' },
  { icon: MessageSquareHeart, label: 'Feedback', path: '/feedback' },
  { icon: Flag, label: 'Report', path: '/report' },
];

interface CreateMenuProps {
  collapsed?: boolean;
}

export function CreateMenu({ collapsed = false }: CreateMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNav = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setOpen(!open)}
        size="icon"
        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-9 w-9 shadow-md shadow-primary/25 transition-transform active:scale-90"
        aria-label="Create"
      >
        <Plus className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 w-72 max-h-[70vh] overflow-y-auto rounded-2xl bg-card border border-border/50 shadow-2xl shadow-black/30"
            >
              {/* Create section */}
              <div className="p-1.5 border-b border-border/40">
                <p className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Create</p>
                {createOptions.map((opt, i) => (
                  <motion.button
                    key={opt.path + opt.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleNav(opt.path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-accent/60 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <opt.icon className="w-[18px] h-[18px] text-primary" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* More pages section */}
              <div className="p-1.5">
                <p className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">More</p>
                {moreOptions.map((opt, i) => (
                  <motion.button
                    key={opt.path}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (i + createOptions.length) * 0.03 }}
                    onClick={() => handleNav(opt.path)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors hover:bg-accent/60 group"
                  >
                    <opt.icon className="w-[18px] h-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="text-[15px] font-medium text-foreground">{opt.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
