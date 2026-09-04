import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlassCard } from '@/components/sigma/GlassCard';
import { Questionnaire, type QuestionnaireStepConfig } from '@/components/common/Questionnaire';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const goalStep: QuestionnaireStepConfig = {
  id: 'goal',
  title: 'What brings you to Sigma?',
  subtitle: 'This shapes what we surface on Discover.',
  options: [
    { value: 'watch', label: 'Watch live', description: 'Follow creators and streams' },
    { value: 'stream', label: 'Go live', description: 'Broadcast to an audience' },
    { value: 'connect', label: 'Connect', description: 'Chat and message people' },
  ],
};

const paceStep: QuestionnaireStepConfig = {
  id: 'pace',
  title: 'How much do you want to see?',
  subtitle: 'You can change this any time in Settings.',
  options: [
    { value: 'focused', label: 'Focused', description: 'Only who I Sigmatize' },
    { value: 'balanced', label: 'Balanced', description: 'A mix of both' },
    { value: 'wide', label: 'Wide open', description: 'Everything trending' },
  ],
};

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<QuestionnaireStepConfig[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth', { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: cats } = await supabase.from('categories').select('id, name, slug').order('name');
      if (cancelled) return;
      const interestStep: QuestionnaireStepConfig = {
        id: 'interests',
        title: 'Pick a few things you care about',
        subtitle: 'Choose at least two categories.',
        multi: true,
        min: 2,
        options: (cats ?? []).map((c) => ({ value: c.slug, label: c.name })),
      };
      setSteps(interestStep.options.length ? [interestStep, goalStep, paceStep] : [goalStep, paceStep]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (stepId: string, value: string, multi: boolean) => {
    setAnswers((prev) => {
      const current = prev[stepId] ?? [];
      if (!multi) return { ...prev, [stepId]: current[0] === value ? [] : [value] };
      return {
        ...prev,
        [stepId]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      };
    });
  };

  const isLast = useMemo(() => index === steps.length - 1, [index, steps.length]);

  const handleNext = async () => {
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }
    if (!user) return;
    setSubmitting(true);
    const rows = Object.entries(answers).flatMap(([stepId, values]) =>
      values.map((v) => ({ user_id: user.id, interest: `${stepId}:${v}`, source: 'onboarding' })),
    );
    const { error } = await supabase.from('user_interests').upsert(rows, { onConflict: 'user_id,interest' });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Could not save your picks', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'You are all set', description: 'Discover is now tuned to your picks.' });
    navigate('/', { replace: true });
  };

  return (
    <AppLayout>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-3 py-8 md:px-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Welcome</p>
          <h1 className="text-2xl font-black tracking-tight">Set up your Sigma</h1>
        </header>

        <GlassCard className="p-5 sm:p-7">
          {loading || authLoading ? (
            <div className="flex h-52 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Questionnaire
              steps={steps}
              index={index}
              answers={answers}
              onToggle={toggle}
              onBack={() => setIndex((i) => Math.max(0, i - 1))}
              onNext={handleNext}
              submitting={submitting}
            />
          )}
        </GlassCard>

        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="mx-auto text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Skip for now
        </button>
      </div>
    </AppLayout>
  );
}
