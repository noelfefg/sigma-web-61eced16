import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlassCard } from '@/components/sigma/GlassCard';
import { Questionnaire, type QuestionnaireStepConfig } from '@/components/common/Questionnaire';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { interestImages } from '@/lib/interestImages';

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<QuestionnaireStepConfig[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        if (!authLoading) navigate('/auth', { replace: true });
        return;
      }
      if (!user.user_metadata?.onboarding_pending) {
        navigate('/', { replace: true });
        return;
      }
      const [{ data: saved, error: savedError }, { data: cats, error }] = await Promise.all([
        supabase.from('user_interests').select('id').eq('user_id', user.id).eq('source', 'onboarding').limit(1),
        supabase.from('categories').select('id, name, slug').order('name'),
      ]);
      if (cancelled) return;
      if (savedError) {
        toast({ title: 'Could not load interests', description: savedError.message, variant: 'destructive' });
        setLoading(false);
        return;
      }
      if (saved?.length) {
        const { error: completionError } = await supabase.auth.updateUser({ data: { onboarding_pending: false } });
        if (completionError) {
          toast({ title: 'Could not finish setup', description: completionError.message, variant: 'destructive' });
          setLoading(false);
          return;
        }
        navigate('/', { replace: true });
        return;
      }
      if (error || !cats || cats.length < 2) {
        toast({ title: 'Could not load interests', description: error?.message ?? 'Please try again in a moment.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const interestStep: QuestionnaireStepConfig = {
        id: 'interests',
        title: 'What are you into?',
        subtitle: 'Choose at least two interests to shape your Discover feed.',
        multi: true,
        min: 2,
        options: (cats ?? []).map((c) => ({ value: c.slug, label: c.name, image: interestImages[c.slug] })),
      };
      setSteps([interestStep]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.user_metadata?.onboarding_pending, authLoading, navigate]);

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

  const handleNext = async () => {
    if (!user) return;
    setSubmitting(true);
    const { data: profile, error: profileLookupError } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
    if (profileLookupError) {
      setSubmitting(false);
      toast({ title: 'Could not save your picks', description: profileLookupError.message, variant: 'destructive' });
      return;
    }
    if (!profile) {
      const username = user.user_metadata?.username;
      if (typeof username !== 'string' || !username.trim()) {
        setSubmitting(false);
        toast({ title: 'Could not finish setup', description: 'Your account needs a username before saving interests.', variant: 'destructive' });
        return;
      }
      const { error: profileError } = await supabase.from('profiles').insert({ id: user.id, username: username.trim(), display_name: username.trim() });
      if (profileError) {
        setSubmitting(false);
        toast({ title: 'Could not finish setup', description: profileError.message, variant: 'destructive' });
        return;
      }
    }
    const rows = (answers.interests ?? []).map((v) => ({ user_id: user.id, interest: `interests:${v}`, source: 'onboarding' }));
    const { error } = await supabase.from('user_interests').insert(rows);
    if (error) {
      setSubmitting(false);
      toast({ title: 'Could not save your picks', description: error.message, variant: 'destructive' });
      return;
    }
    const { error: completionError } = await supabase.auth.updateUser({ data: { onboarding_pending: false } });
    setSubmitting(false);
    if (completionError) {
      toast({ title: 'Could not finish setup', description: completionError.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'You are all set', description: 'Your live feed is tuned to your interests.' });
    navigate('/', { replace: true });
  };

  return (
    <AppLayout>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-3 py-8 md:px-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Welcome</p>
          <h1 className="text-2xl font-black tracking-tight">Choose your interests</h1>
        </header>

        <GlassCard className="p-5 sm:p-7">
          {loading || authLoading ? (
            <div className="flex h-52 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Questionnaire
              steps={steps}
              index={0}
              answers={answers}
              onToggle={toggle}
              onBack={() => {}}
              onNext={handleNext}
              submitting={submitting}
            />
          )}
        </GlassCard>

      </div>
    </AppLayout>
  );
}
