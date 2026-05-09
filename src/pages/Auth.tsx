import { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import LineWaves from '@/components/LineWaves';

export default function AuthPage() {
  const { user, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
        else { toast({ title: 'Welcome back!', description: 'Signed in successfully.' }); navigate('/'); }
      } else {
        if (!username.trim()) { toast({ title: 'Error', description: 'Username is required', variant: 'destructive' }); setLoading(false); return; }
        const { error } = await signUp(email, password, username);
        if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
        else { toast({ title: 'Account created!', description: 'Welcome to SIGMA!' }); navigate('/'); }
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen w-full relative bg-black text-white">
      {/* Fallback gradient (always visible behind Galaxy in case WebGL fails) */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_hsl(220_30%_15%)_0%,_hsl(220_40%_4%)_60%,_#000_100%)]" />
      {/* Galaxy background */}
      <div className="fixed inset-0 z-0 opacity-90">
        <Galaxy density={1.0} hueShift={220} glowIntensity={0.5} saturation={0.15} twinkleIntensity={0.5} mouseRepulsion mouseInteraction />
      </div>
      {/* Vignette */}
      <div className="fixed inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.75)_100%)]" />

      <div className="relative z-20 min-h-screen flex items-center justify-center p-4 py-10 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to SIGMA
          </Link>

          {/* Glass hover card */}
          <div
            className="group relative rounded-2xl p-8 transition-all duration-500 hover:scale-[1.01]"
            style={{
              background: 'rgba(20, 20, 25, 0.55)',
              backdropFilter: 'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {/* Hover glow border */}
            <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0) 60%)', WebkitMask: 'linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)', WebkitMaskComposite: 'xor', padding: '1px' }} />

            <div className="text-center mb-7">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{isLogin ? 'Welcome back' : 'Create account'}</h1>
              <p className="text-white/60 mt-1 text-sm">{isLogin ? 'Sign in to continue to SIGMA' : 'Join the SIGMA community'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white/80">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input id="username" type="text" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-white/5 border-white/15 text-white placeholder:text-white/40 focus-visible:ring-white/30" required />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/5 border-white/15 text-white placeholder:text-white/40 focus-visible:ring-white/30" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/5 border-white/15 text-white placeholder:text-white/40 focus-visible:ring-white/30" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading}
                className="w-full h-11 rounded-xl bg-white text-black hover:bg-white/90 font-semibold transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <p className="text-center mt-6 text-white/60 text-sm">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setIsLogin(!isLogin)} className="text-white hover:underline font-medium">
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
