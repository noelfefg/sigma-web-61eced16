/**
 * Report.tsx - Instagram-style multi-step report flow
 *
 * URL: /report?type=post&id=<uuid>
 *      /report?type=user&id=<username>
 *      /report?type=comment&id=<uuid>
 *
 * Steps: 1. Choose reason → 2. Add details → 3. Confirmation
 */
import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Flag } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Reasons match Instagram's actual categories
const REASONS = [
  { id: 'spam',           label: "It's spam",                    icon: '🚫', desc: 'Unwanted commercial content or scams' },
  { id: 'nudity',         label: 'Nudity or sexual content',     icon: '🔞', desc: 'Explicit or adult content' },
  { id: 'violence',       label: 'Violence or dangerous',        icon: '⚠️', desc: 'Graphic violence or dangerous activities' },
  { id: 'harassment',     label: 'Harassment or bullying',       icon: '😤', desc: 'Targeting someone personally' },
  { id: 'misinformation', label: 'False information',            icon: '❌', desc: 'Misleading or false claims' },
  { id: 'hate',           label: 'Hate speech',                  icon: '🚨', desc: 'Content that attacks a protected group' },
  { id: 'self_harm',      label: 'Self-harm or suicide',         icon: '💙', desc: 'Content promoting self-harm' },
  { id: 'copyright',      label: 'Intellectual property',        icon: '©️',  desc: 'Unauthorized use of content' },
  { id: 'other',          label: 'Something else',               icon: '🔍', desc: 'Other concerns' },
];

export default function ReportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();

  const targetType = params.get('type') || 'post';  // post | user | comment | stream | short
  const targetId   = params.get('id') || '';

  const [step, setStep] = useState<'reason' | 'details' | 'done'>('reason');
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedReason = REASONS.find(r => r.id === reason);

  const submit = async () => {
    if (!user || !reason) return;
    setSubmitting(true);
    try {
      await (supabase as any).from('reports').insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason,
        description: details.trim() || null,
        status: 'pending',
      });
      setStep('done');
    } catch (e: any) {
      toast({ title: 'Could not submit report', description: e?.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  return (
    <AppLayout>
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step === 'reason' ? navigate(-1) : setStep('reason')}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-black text-white">
              {step === 'done' ? 'Report Submitted' : 'Report'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {targetType === 'user' ? 'Report account' : `Report ${targetType}`}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Choose reason */}
          {step === 'reason' && (
            <motion.div key="reason" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
              <div className="rounded-2xl overflow-hidden border border-border">
                <div className="px-4 py-3 bg-card border-b border-border">
                  <p className="text-sm font-semibold text-white">Why are you reporting this?</p>
                  <p className="text-xs mt-0.5 text-muted-foreground">
                    Your report is anonymous. We'll review it within 24 hours.
                  </p>
                </div>
                {REASONS.map((r, i) => (
                  <button key={r.id} onClick={() => { setReason(r.id); setStep('details'); }}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-background hover:bg-white/5 transition-colors"
                    style={{
                      borderBottom: i < REASONS.length - 1 ? '1px solid hsl(0 0% 20%)' : 'none',
                    }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl w-7 text-center">{r.icon}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">{r.label}</p>
                        <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Additional details */}
          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
              <div className="rounded-2xl overflow-hidden mb-4 bg-card border border-border">
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                  <span className="text-2xl">{selectedReason?.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{selectedReason?.label}</p>
                    <p className="text-[11px] text-muted-foreground">{selectedReason?.desc}</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-white mb-2">Additional details (optional)</p>
                  <textarea
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none bg-input border border-border text-foreground"
                    style={{ minHeight: 100 }}
                    placeholder="Describe what's happening (optional)…"
                    value={details}
                    onChange={e => setDetails(e.target.value.slice(0, 500))}
                    maxLength={500}
                  />
                  <p className="text-[10px] text-right mt-1 text-muted-foreground">{details.length}/500</p>
                </div>
              </div>

              {!user && (
                <div className="mb-4 p-3 rounded-xl flex items-center gap-2 border border-destructive/20 bg-destructive/5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">
                    <Link to="/auth" className="font-bold underline">Sign in</Link> to submit a report
                  </p>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={submit}
                disabled={!user || submitting}
                className="w-full py-3.5 rounded-2xl text-sm font-black disabled:opacity-40 transition-opacity flex items-center justify-center gap-2 bg-destructive text-destructive-foreground">
                {submitting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <><Flag className="w-4 h-4" />Submit Report</>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-12 gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center bg-green-500/10 border border-green-500/20">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-2">Thanks for reporting</h2>
                <p className="text-sm leading-relaxed text-muted-foreground" style={{ maxWidth: 280 }}>
                  Your report is anonymous. We'll review it and take action if it violates our community guidelines.
                </p>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => navigate(-1)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-secondary text-secondary-foreground border border-border">
                  Go Back
                </button>
                <Link to="/">
                  <button className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary-foreground text-primary">
                    Home
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}