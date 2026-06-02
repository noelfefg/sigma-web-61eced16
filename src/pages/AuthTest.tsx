import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import Stepper, { Step } from '@/components/ui/stepper/Stepper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type Result = { ok: boolean; msg: string } | null;

function ResultLine({ label, result, loading }: { label: string; result: Result; loading?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm py-1">
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        : result?.ok ? <CheckCircle2 className="w-4 h-4 text-green-500" />
        : result ? <XCircle className="w-4 h-4 text-red-500" />
        : <div className="w-4 h-4 rounded-full border border-border" />}
      <span className="text-foreground">{label}</span>
      {result && <span className="text-muted-foreground truncate">— {result.msg}</span>}
    </div>
  );
}

export default function AuthTestPage() {
  const { user, signUp, signIn, signOut } = useAuth();
  const seedEmail = `test_${Date.now().toString(36)}@sigma.test`;
  const [email, setEmail] = useState(seedEmail);
  const [password, setPassword] = useState('Test1234!');
  const [username, setUsername] = useState(`tester_${Math.random().toString(36).slice(2, 7)}`);

  const [r1, setR1] = useState<Result>(null);
  const [r2, setR2] = useState<Result>(null);
  const [r3, setR3] = useState<Result>(null);
  const [r4, setR4] = useState<Result>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const runSignUp = async () => {
    setBusy('signup');
    const { error } = await signUp(email, password, username);
    setR1(error ? { ok: false, msg: error.message } : { ok: true, msg: 'account created' });
    setBusy(null);
  };
  const runSignIn = async () => {
    setBusy('signin');
    const { error } = await signIn(email, password);
    setR2(error ? { ok: false, msg: error.message } : { ok: true, msg: 'signed in' });
    setBusy(null);
  };
  const runSession = async () => {
    setBusy('session');
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) { setR3({ ok: false, msg: error?.message || 'no user' }); setBusy(null); return; }
    const { data: prof } = await supabase.from('profiles').select('username, display_name').eq('id', data.user.id).maybeSingle();
    setR3({ ok: true, msg: `uid ${data.user.id.slice(0, 8)} • profile ${prof?.username || '—'}` });
    setBusy(null);
  };
  const runSignOut = async () => {
    setBusy('signout');
    await signOut();
    setR4({ ok: true, msg: 'session cleared' });
    setBusy(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold mb-1">Auth Test Harness</h1>
        <p className="text-sm text-muted-foreground mb-6">Walk the stepper to verify signup → signin → session → signout end-to-end.</p>

        <Stepper
          initialStep={1}
          backButtonText="Previous"
          nextButtonText="Next"
        >
          <Step>
            <h2 className="text-lg font-semibold mb-3">Step 1 — Sign up</h2>
            <div className="space-y-3">
              <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <div><Label>Username</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} /></div>
              <button onClick={runSignUp} disabled={busy === 'signup'}
                className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                Run sign-up
              </button>
              <ResultLine label="signUp()" result={r1} loading={busy === 'signup'} />
            </div>
          </Step>

          <Step>
            <h2 className="text-lg font-semibold mb-3">Step 2 — Sign in</h2>
            <p className="text-sm text-muted-foreground mb-3">Uses the credentials from step 1.</p>
            <button onClick={runSignIn} disabled={busy === 'signin'}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              Run sign-in
            </button>
            <div className="mt-3"><ResultLine label="signIn()" result={r2} loading={busy === 'signin'} /></div>
          </Step>

          <Step>
            <h2 className="text-lg font-semibold mb-3">Step 3 — Session & profile</h2>
            <p className="text-sm text-muted-foreground mb-3">Verifies the JWT and reads your profile row.</p>
            <button onClick={runSession} disabled={busy === 'session'}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              Check session
            </button>
            <div className="mt-3"><ResultLine label="auth.getUser() + profiles" result={r3} loading={busy === 'session'} /></div>
          </Step>

          <Step>
            <h2 className="text-lg font-semibold mb-3">Step 4 — Sign out</h2>
            <button onClick={runSignOut} disabled={busy === 'signout'}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              Sign out
            </button>
            <div className="mt-3"><ResultLine label="signOut()" result={r4} loading={busy === 'signout'} /></div>

            <div className="mt-5 p-3 rounded-md border border-border bg-muted/30">
              <p className="text-xs font-semibold mb-2">Summary</p>
              <ResultLine label="Sign up" result={r1} />
              <ResultLine label="Sign in" result={r2} />
              <ResultLine label="Session" result={r3} />
              <ResultLine label="Sign out" result={r4} />
              <p className="text-xs text-muted-foreground mt-2">Current user: {user?.email || '—'}</p>
            </div>
          </Step>
        </Stepper>
      </div>
    </div>
  );
}
