import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type TargetType = 'stream' | 'post' | 'short' | 'comment' | 'user' | 'message';

const REASONS = [
  { value: 'spam', label: 'Spam or scam' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'sexual', label: 'Sexual or inappropriate content' },
  { value: 'violence', label: 'Violence or dangerous acts' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'copyright', label: 'Copyright / IP' },
  { value: 'other', label: 'Something else' },
];

interface ReportButtonProps {
  targetType: TargetType;
  targetId: string;
  variant?: 'icon' | 'menu' | 'inline';
  className?: string;
}

export function ReportButton({ targetType, targetId, variant = 'icon', className }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const submit = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to report content.' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id, target_type: targetType, target_id: targetId, reason, details: details || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Could not submit', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Report submitted', description: 'Thanks — our team will review it.' });
    setOpen(false);
    setDetails('');
  };

  const trigger =
    variant === 'menu' ? (
      <button onClick={() => setOpen(true)} className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-lg ${className || ''}`}>
        <Flag className="w-4 h-4" /> Report
      </button>
    ) : variant === 'inline' ? (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className={className}>
        <Flag className="w-4 h-4 mr-1.5" /> Report
      </Button>
    ) : (
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Report" className={className}>
        <Flag className="w-4 h-4" />
      </Button>
    );

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report this {targetType}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
              {REASONS.map((r) => (
                <div key={r.value} className="flex items-center gap-2">
                  <RadioGroupItem id={`r-${r.value}`} value={r.value} />
                  <Label htmlFor={`r-${r.value}`} className="text-sm cursor-pointer">{r.label}</Label>
                </div>
              ))}
            </RadioGroup>
            <Textarea placeholder="Additional details (optional)" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit report'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
