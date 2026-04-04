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
            <p className="text-xs" style={{ color: '#6b7280' }}>
              {targetType === 'user' ? 'Report account' : `Report ${targetType}`}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Choose reason */}
          {step === 'reason' && (
            <motion.div key="reason" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1f1f1f' }}>
                <div className="px-4 py-3" style={{ background: '#111', borderBottom: '1px solid #1f1f1f' }}>
                  <p className="text-sm font-semibold text-white">Why are you reporting this?</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                    Your report is anonymous. We'll review it within 24 hours.
                  </p>
                </div>
                {REASONS.map((r, i) => (
                  <button key={r.id} onClick={() => { setReason(r.id); setStep('details'); }}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors"
                    style={{
                      background: '#0a0a0a',
                      borderBottom: i < REASONS.length - 1 ? '1px solid #1a1a1a' : 'none',
                    }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl w-7 text-center">{r.icon}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">{r.label}</p>
                        <p className="text-[11px]" style={{ color: '#555' }}>{r.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#444' }} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Additional details */}
          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
              <div className="rounded-2xl overflow-hidden mb-4" style={{ background: '#111', border: '1px solid #1f1f1f' }}>
                <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid #1f1f1f' }}>
                  <span className="text-2xl">{selectedReason?.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{selectedReason?.label}</p>
                    <p className="text-[11px]" style={{ color: '#555' }}>{selectedReason?.desc}</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-white mb-2">Additional details (optional)</p>
                  <textarea
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                    style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#e5e7eb',
                      minHeight: 100 }}
                    placeholder="Describe what's happening (optional)…"
                    value={details}
                    onChange={e => setDetails(e.target.value.slice(0, 500))}
                    maxLength={500}
                  />
                  <p className="text-[10px] text-right mt-1" style={{ color: '#555' }}>{details.length}/500</p>
                </div>
              </div>

              {!user && (
                <div className="mb-4 p-3 rounded-xl flex items-center gap-2"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
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
                className="w-full py-3.5 rounded-2xl text-sm font-black disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
                style={{ background: '#ef4444', color: '#fff' }}>
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
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <CheckCircle className="w-10 h-10" style={{ color: '#22c55e' }} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-2">Thanks for reporting</h2>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280', maxWidth: 280 }}>
                  Your report is anonymous. We'll review it and take action if it violates our community guidelines.
                </p>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => navigate(-1)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: '#1a1a1a', color: '#e5e7eb', border: '1px solid #2a2a2a' }}>
                  Go Back
                </button>
                <Link to="/">
                  <button className="px-5 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: '#e5e7eb', color: '#000' }}>
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
