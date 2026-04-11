import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Wand2, ImageIcon, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AIStreamAssistantProps {
  onSuggestTitle?: (title: string) => void;
  onToggleModeration?: (enabled: boolean) => void;
}

const TITLE_SUGGESTIONS = [
  'Chill Vibes & Gaming 🎮',
  'Late Night Chat & Gameplay',
  'Pro Ranked Grind 🔥',
  'Creative Building Stream',
  'Variety Stream - Come Hang!',
  'Tournament Practice Day',
  'Community Game Night 🎉',
];

const TAG_SUGGESTIONS = [
  'gaming', 'chill', 'competitive', 'creative', 'funny',
  'tutorial', 'speedrun', 'casual', 'pro', 'community',
];

const TOXIC_KEYWORDS = ['hate', 'kill', 'stupid', 'idiot', 'trash', 'noob', 'kys', 'die'];

export function AIStreamAssistant({ onSuggestTitle, onToggleModeration }: AIStreamAssistantProps) {
  const [open, setOpen] = useState(false);
  const [suggestedTitle, setSuggestedTitle] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [modEnabled, setModEnabled] = useState(false);
  const [generating, setGenerating] = useState(false);

  function generateTitle() {
    setGenerating(true);
    setTimeout(() => {
      const t = TITLE_SUGGESTIONS[Math.floor(Math.random() * TITLE_SUGGESTIONS.length)];
      setSuggestedTitle(t);
      const shuffled = [...TAG_SUGGESTIONS].sort(() => Math.random() - 0.5);
      setSuggestedTags(shuffled.slice(0, 4));
      setGenerating(false);
    }, 800);
  }



  function toggleModeration() {
    setModEnabled(!modEnabled);
    onToggleModeration?.(!modEnabled);
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-30 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 flex items-center justify-center text-primary-foreground"
      >
        <Sparkles className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-36 right-4 md:bottom-20 md:right-6 z-30 w-80 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />AI Stream Assistant
              </h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* Title Suggestion */}
              <div className="space-y-2">
                <Button variant="outline" size="sm" onClick={generateTitle} disabled={generating} className="w-full gap-2">
                  <Wand2 className="w-3.5 h-3.5" />{generating ? 'Generating...' : 'Suggest Title & Tags'}
                </Button>
                {suggestedTitle && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <button
                      onClick={() => { onSuggestTitle?.(suggestedTitle); }}
                      className="w-full text-left p-3 rounded-xl bg-primary/10 border border-primary/20 text-sm text-foreground hover:bg-primary/15 transition-colors"
                    >
                      {suggestedTitle}
                    </button>
                    {suggestedTags.length === 0 && (() => { generateTags(); return null; })()}
                    <div className="flex flex-wrap gap-1">
                      {suggestedTags.map(tag => (
                        <span key={tag} className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">#{tag}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Generate Thumbnail */}
              <Button variant="outline" size="sm" className="w-full gap-2">
                <ImageIcon className="w-3.5 h-3.5" />Generate Thumbnail
              </Button>

              {/* Chat Moderation */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${modEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium text-foreground">Smart Moderation</span>
                </div>
                <button
                  onClick={toggleModeration}
                  className={`w-10 h-5 rounded-full transition-colors relative ${modEnabled ? 'bg-primary' : 'bg-muted'}`}
                >
                  <motion.div
                    className="w-4 h-4 rounded-full bg-white absolute top-0.5"
                    animate={{ left: modEnabled ? 22 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
              {modEnabled && <p className="text-[11px] text-muted-foreground">Auto-hiding toxic messages using keyword filter</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Export the filter function for use in chat
export function filterToxicMessage(message: string): boolean {
  const lower = message.toLowerCase();
  const TOXIC_KEYWORDS = ['hate', 'kill', 'stupid', 'idiot', 'trash', 'noob', 'kys', 'die'];
  return TOXIC_KEYWORDS.some(kw => lower.includes(kw));
}
