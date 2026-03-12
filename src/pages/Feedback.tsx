import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquareHeart, Send, CheckCircle2, Sparkles, ThumbsUp, Bug, Lightbulb, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const categories = [
  { id: 'general', label: 'General', icon: ThumbsUp, color: 'from-blue-500 to-cyan-500' },
  { id: 'bug', label: 'Bug Report', icon: Bug, color: 'from-red-500 to-orange-500' },
  { id: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'from-amber-500 to-yellow-500' },
  { id: 'help', label: 'Help', icon: HelpCircle, color: 'from-purple-500 to-pink-500' },
];

export default function FeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (rating === 0) { toast({ title: 'Please select a rating', variant: 'destructive' }); return; }
    if (!message.trim()) { toast({ title: 'Please write a message', variant: 'destructive' }); return; }

    setSubmitting(true);
    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      rating,
      category,
      message: message.trim(),
    });
    setSubmitting(false);

    if (error) {
      toast({ title: 'Failed to submit feedback', variant: 'destructive' });
    } else {
      setSubmitted(true);
      toast({ title: 'Thank you for your feedback! 🎉' });
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <MessageSquareHeart className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Sign in to share feedback</h1>
          <Link to="/auth"><Button>Sign In</Button></Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-3xl font-black text-foreground">Thank You!</h2>
              <p className="text-muted-foreground">Your feedback helps us improve SIGMA for everyone.</p>
              <Button onClick={() => { setSubmitted(false); setRating(0); setMessage(''); setCategory('general'); }}>
                Submit Another
              </Button>

              {/* Confetti particles */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${10 + Math.random() * 40}%`,
                    background: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bff'][i % 5],
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    y: [0, -100 - Math.random() * 100],
                    x: [(Math.random() - 0.5) * 200],
                  }}
                  transition={{ duration: 2, delay: i * 0.08, ease: 'easeOut' }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-2">
                <motion.div
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="inline-block"
                >
                  <Sparkles className="w-10 h-10 text-primary mx-auto" />
                </motion.div>
                <h1 className="text-3xl font-black text-foreground">Share Your Feedback</h1>
                <p className="text-muted-foreground">Help us make SIGMA even better</p>
              </div>

              {/* Category Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {categories.map((cat) => (
                    <motion.button
                      key={cat.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        category === cat.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                        <cat.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-foreground">{cat.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Star Rating */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Rating</label>
                <div className="flex items-center gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileHover={{ scale: 1.3, rotate: 15 }}
                      whileTap={{ scale: 0.8 }}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-10 h-10 transition-all duration-200 ${
                          star <= (hoveredStar || rating)
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {rating === 0 && 'Tap a star to rate'}
                  {rating === 1 && '😞 Poor'}
                  {rating === 2 && '😐 Fair'}
                  {rating === 3 && '🙂 Good'}
                  {rating === 4 && '😊 Great'}
                  {rating === 5 && '🤩 Amazing!'}
                </p>
              </div>

              {/* Message */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Your Message</label>
                <Textarea
                  placeholder="Tell us what you think, what could be better, or what you love..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[120px] resize-none rounded-2xl"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">{message.length}/1000</p>
              </div>

              {/* Submit */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full h-12 text-base font-bold rounded-2xl"
                  size="lg"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {submitting ? 'Submitting...' : 'Send Feedback'}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
