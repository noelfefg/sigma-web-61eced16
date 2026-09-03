import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface QuestionnaireOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

export interface QuestionnaireStepConfig {
  id: string;
  title: string;
  subtitle?: string;
  options: QuestionnaireOption[];
  multi?: boolean;
  /** Minimum selections required to continue. */
  min?: number;
}

export interface QuestionnaireProps {
  steps: QuestionnaireStepConfig[];
  index: number;
  answers: Record<string, string[]>;
  onToggle: (stepId: string, value: string, multi: boolean) => void;
  onBack: () => void;
  onNext: () => void;
  submitting?: boolean;
  nextLabel?: string;
  className?: string;
}

/**
 * Multi-step preference questionnaire used by Sigma onboarding.
 * Presentational only — persistence stays with the caller.
 */
export function Questionnaire({
  steps,
  index,
  answers,
  onToggle,
  onBack,
  onNext,
  submitting = false,
  nextLabel,
  className,
}: QuestionnaireProps) {
  const step = steps[index];
  if (!step) return null;
  const selected = answers[step.id] ?? [];
  const min = step.min ?? 1;
  const canContinue = selected.length >= min;
  const isLast = index === steps.length - 1;

  return (
    <div className={cn('flex w-full flex-col gap-6', className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Step {index + 1} of {steps.length}
          </span>
          <span>
            {selected.length} selected{min > 1 ? ` · pick at least ${min}` : ''}
          </span>
        </div>
        <Progress value={((index + 1) / steps.length) * 100} className="h-1" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="space-y-5"
        >
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{step.title}</h2>
            {step.subtitle && <p className="text-sm text-muted-foreground">{step.subtitle}</p>}
          </div>

          <div
            role={step.multi ? 'group' : 'radiogroup'}
            aria-label={step.title}
            className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
          >
            {step.options.map((opt) => {
              const active = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  role={step.multi ? 'checkbox' : 'radio'}
                  aria-checked={active}
                  onClick={() => onToggle(step.id, opt.value, !!step.multi)}
                  className={cn(
                    'group relative flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all duration-200',
                    active
                      ? 'border-foreground/40 bg-foreground/10 text-foreground'
                      : 'border-border bg-card/60 text-muted-foreground hover:border-foreground/20 hover:bg-secondary/60 hover:text-foreground',
                  )}
                >
                  {opt.icon && <span className="text-foreground/80">{opt.icon}</span>}
                  <span className="text-sm font-semibold">{opt.label}</span>
                  {opt.description && <span className="text-[11px] leading-snug">{opt.description}</span>}
                  {active && (
                    <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack} disabled={index === 0 || submitting} className="rounded-full">
          Back
        </Button>
        <Button onClick={onNext} disabled={!canContinue || submitting} className="rounded-full px-6 font-semibold">
          {nextLabel ?? (isLast ? 'Finish' : 'Continue')}
        </Button>
      </div>
    </div>
  );
}
