import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, CheckCircle2, Loader2, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MTNMomoDialogProps {
  open: boolean;
  amount: number;
  currency?: string;
  onClose: () => void;
  onSuccess: (txnRef: string, phone: string) => void;
}

type Step = 'phone' | 'pending' | 'success';

/**
 * MTN Mobile Money payment dialog (Cameroon / MoMo).
 * Frontend flow: collects MSISDN → simulates USSD push → confirms.
 * Backend integration with the MTN Collections API can be wired
 * later via an edge function using MTN_API_USER / MTN_API_KEY secrets.
 */
export function MTNMomoDialog({ open, amount, currency = 'XAF', onClose, onSuccess }: MTNMomoDialogProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  function reset() {
    setStep('phone'); setPhone(''); setError('');
  }

  async function initiate() {
    const cleaned = phone.replace(/\D/g, '');
    // MTN Cameroon prefixes: 67, 65 (650-654), 68
    if (!/^(237)?(67|65[0-4]|68)\d{7}$/.test(cleaned)) {
      setError('Enter a valid MTN number (e.g. 67XXXXXXX)');
      return;
    }
    setError('');
    setStep('pending');
    // Simulated USSD prompt window
    await new Promise(r => setTimeout(r, 4500));
    const ref = `MOMO-${Date.now().toString(36).toUpperCase()}`;
    setStep('success');
    setTimeout(() => {
      onSuccess(ref, cleaned);
      reset();
    }, 1500);
  }

  function handleClose() {
    if (step === 'pending') return;
    onClose();
    setTimeout(reset, 300);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header — MTN brand stripe (yellow) */}
              <div className="relative bg-gradient-to-r from-yellow-400 to-yellow-500 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center font-extrabold text-yellow-400 text-xs">MTN</div>
                  <div>
                    <p className="text-sm font-extrabold text-black">MoMo Pay</p>
                    <p className="text-[11px] text-black/70">Mobile Money</p>
                  </div>
                </div>
                {step !== 'pending' && (
                  <button onClick={handleClose} className="text-black/70 hover:text-black">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="p-6 space-y-5">
                {/* Amount display */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Amount due</p>
                  <p className="text-3xl font-extrabold text-foreground mt-1">
                    {amount.toLocaleString()} <span className="text-base text-muted-foreground">{currency}</span>
                  </p>
                </div>

                {step === 'phone' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                        MTN Mobile Money number
                      </label>
                      <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-secondary border border-border focus-within:border-foreground/40 transition-colors">
                        <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground">+237</span>
                        <input
                          type="tel"
                          autoFocus
                          inputMode="numeric"
                          placeholder="67X XXX XXX"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder-muted-foreground"
                        />
                      </div>
                      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/60">
                      <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        You'll receive a USSD prompt on your phone. Enter your MoMo PIN to confirm payment.
                      </p>
                    </div>

                    <Button onClick={initiate} className="w-full h-12 rounded-xl font-bold text-base">
                      Pay {amount.toLocaleString()} {currency}
                    </Button>
                  </motion.div>
                )}

                {step === 'pending' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4 space-y-4">
                    <div className="relative w-24 h-24 mx-auto">
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-yellow-500/20"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-2 rounded-full border-4 border-yellow-500/40"
                        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0.2, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Smartphone className="w-10 h-10 text-foreground" />
                      </div>
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">Check your phone</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        We sent a payment request to <span className="font-semibold text-foreground">+237 {phone}</span>
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Waiting for confirmation…
                    </div>
                  </motion.div>
                )}

                {step === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 14 }}
                    className="text-center py-4 space-y-3"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                      className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    </motion.div>
                    <div>
                      <p className="text-lg font-extrabold text-foreground">Payment successful</p>
                      <p className="text-xs text-muted-foreground mt-1">Thank you — your order is being processed.</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
