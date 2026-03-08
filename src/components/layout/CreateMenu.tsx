import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ImageIcon, Video, Play, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const createOptions = [
  { icon: ImageIcon, label: 'Post', description: 'Share a photo or text', action: 'post' },
  { icon: Video, label: 'Video', description: 'Upload a video', action: 'video' },
  { icon: Play, label: 'Lil Vid', description: 'Create a short clip', action: 'lilvid' },
  { icon: Radio, label: 'Go Live', description: 'Start streaming', action: 'golive' },
];

export function CreateMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    setOpen(false);
    switch (action) {
      case 'post':
        navigate('/feed');
        break;
      case 'video':
        navigate('/feed');
        break;
      case 'lilvid':
        navigate('/shorts');
        break;
      case 'golive':
        navigate('/go-live');
        break;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative text-muted-foreground hover:text-foreground h-8 w-8"
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="w-5 h-5" />
        </motion.div>
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/20 overflow-hidden"
            >
              <div className="p-1.5">
                {createOptions.map((opt, i) => (
                  <motion.button
                    key={opt.action}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleAction(opt.action)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-accent/60 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <opt.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
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
