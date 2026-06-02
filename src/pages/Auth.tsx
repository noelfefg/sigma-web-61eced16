import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import LineWaves from '@/components/LineWaves';
import Stepper, { Step } from '@/components/ui/stepper/Stepper';

export default function AuthPage() {
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  if (!authLoading && user) return <Navigate to="/you" replace />;

  const submit = async () => {
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
        toast({ title: 'Welcome back!', description: 'Signed in.' });
        navigate('/you', { replace: true });
      } else {
        if (!username.trim()) { toast({ title: 'Username required', variant: 'destructive' }); return; }
        const { error } = await signUp(email, password, username);
        if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
        toast({ title: 'Account created!', description: 'Welcome to SIGMA.' });
        navigate('/you', { replace: true });
      }
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen w-full relative bg-black text-white">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_hsl(220_30%_15%)_0%,_hsl(220_40%_4%)_60%,_#000_100%)]" />
      <div className="fixed inset-0 z-0">
        <LineWaves brightness={0.28} colorCycleSpeed={0.6} warpIntensity={1.0} rotation={-45} color1="#7dd3fc" color2="#a78bfa" color3="#f0abfc" />
      </div>
      <div className="fixed inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.75)_100%)]" />

      <div className="relative z-20 min-h-screen flex items-center justify-center p-4 py-10 overflow-y-auto">
        <div className="w-full max-w-lg animate-fade-in">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to SIGMA
          </Link>

          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center bg-white/10 border border-white/15">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Join SIGMA</h1>
            <p className="text-white/60 text-sm">Three quick steps.</p>
          </div>

          <Stepper
            initialStep={1}
            backButtonText="Back"
            nextButtonText="Continue"
            onFinalStepCompleted={submit}
          >
            <Step>
              <h2 className="text-base font-semibold mb-3 text-foreground">What would you like to do?</h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setMode('login')}
                  className={`p-4 rounded-xl border text-left transition ${mode === 'login' ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted/40'}`}>
                  <LogIn className="w-5 h-5 mb-2 text-foreground" />
                  <div className="font-semibold text-foreground">Sign in</div>
                  <div className="text-xs text-muted-foreground">I already have an account</div>
                </button>
                <button onClick={() => setMode('signup')}
                  className={`p-4 rounded-xl border text-left transition ${mode === 'signup' ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted/40'}`}>
                  <UserPlus className="w-5 h-5 mb-2 text-foreground" />
                  <div className="font-semibold text-foreground">Create account</div>
                  <div className="text-xs text-muted-foreground">I'm new here</div>
                </button>
              </div>
            </Step>

            <Step>
              <h2 className="text-base font-semibold mb-3 text-foreground">
                {mode === 'login' ? 'Sign in' : 'Create your account'}
              </h2>
              <div className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <Label>Username</Label>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_handle" />
                  </div>
                )}
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} />
                </div>
              </div>
            </Step>

            <Step>
              <h2 className="text-base font-semibold mb-3 text-foreground">Review & confirm</h2>
              <div className="rounded-lg border border-border bg-card p-3 text-sm space-y-1">
                <div><span className="text-muted-foreground">Mode:</span> <span className="text-foreground">{mode}</span></div>
                {mode === 'signup' && <div><span className="text-muted-foreground">Username:</span> <span className="text-foreground">@{username || '—'}</span></div>}
                <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{email || '—'}</span></div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {submitting ? 'Submitting…' : 'Press "Complete" to finish.'}
              </p>
            </Step>
          </Stepper>

          <p className="text-center mt-4 text-white/60 text-xs">
            By continuing you agree to SIGMA's terms.
          </p>
        </div>
      </div>
    </div>
  );
}
