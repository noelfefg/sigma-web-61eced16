/**
 * RelationshipStatus - Facebook-style relationship status selector & display
 *
 * Components:
 *   RelationshipStatusBadge  - small read-only badge shown on profiles
 *   RelationshipStatusEditor - dropdown selector in settings
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Check, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const RELATIONSHIP_OPTIONS = [
  { value: 'single',               label: 'Single',                emoji: '🙋' },
  { value: 'in_relationship',      label: 'In a Relationship',     emoji: '❤️' },
  { value: 'engaged',              label: 'Engaged',               emoji: '💍' },
  { value: 'married',              label: 'Married',               emoji: '💑' },
  { value: 'its_complicated',      label: "It's Complicated",      emoji: '😅' },
  { value: 'in_open_relationship', label: 'In an Open Relationship',emoji: '🫶' },
  { value: 'widowed',              label: 'Widowed',               emoji: '🕯️' },
  { value: 'separated',            label: 'Separated',             emoji: '💔' },
  { value: 'divorced',             label: 'Divorced',              emoji: '✂️' },
];

/** Small badge for profile pages */
export function RelationshipStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const opt = RELATIONSHIP_OPTIONS.find(o => o.value === status);
  if (!opt) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
      <span>{opt.emoji}</span>{opt.label}
    </span>
  );
}

/** Dropdown editor for settings page */
export function RelationshipStatusEditor({
  userId, current, onSaved,
}: { userId: string; current: string | null; onSaved?: (v: string | null) => void }) {
  const [selected, setSelected] = useState<string | null>(current);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const currentOpt = RELATIONSHIP_OPTIONS.find(o => o.value === selected);

  const save = async (value: string | null) => {
    setSaving(true);
    try {
      await (supabase as any).from('profiles')
        .update({ relationship_status: value }).eq('id', userId);
      setSelected(value);
      onSaved?.(value);
      toast({ title: '✅ Relationship status saved' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message, variant: 'destructive' });
    }
    setOpen(false);
    setSaving(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} disabled={saving}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm w-full text-left"
        style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#e5e7eb' }}>
        <Heart className="w-4 h-4 shrink-0" style={{ color: '#ef4444' }} />
        <span className="flex-1">
          {currentOpt ? `${currentOpt.emoji} ${currentOpt.label}` : 'Set relationship status'}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-auto z-50"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', maxHeight: 300 }}>
            {selected && (
              <button onClick={() => save(null)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                style={{ color: '#6b7280', borderBottom: '1px solid #2a2a2a' }}>
                <X className="w-4 h-4" />Clear status
              </button>
            )}
            {RELATIONSHIP_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => save(opt.value)} disabled={saving}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                style={{ color: selected === opt.value ? '#e5e7eb' : '#9ca3af' }}>
                <span className="w-6 text-center text-base">{opt.emoji}</span>
                <span className="flex-1 text-left">{opt.label}</span>
                {selected === opt.value && <Check className="w-4 h-4" style={{ color: '#22c55e' }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
