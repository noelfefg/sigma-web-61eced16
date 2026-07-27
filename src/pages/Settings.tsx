import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Shield, User, CheckCircle2, Sparkles, MousePointer2, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getCursorEnabled, setCursorEnabled } from '@/components/CursorProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'account' | 'appearance' | 'verification';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('account');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('avatar_url, username, display_name, bio').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        setAvatarUrl(data?.avatar_url || null);
        setUsername(data?.username || '');
        setDisplayName(data?.display_name || '');
        setBio(data?.bio || '');
      });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles')
      .update({ username: username.trim().toLowerCase(), display_name: displayName.trim(), bio: bio.trim() || null })
      .eq('id', user.id);
    setSaving(false);
    toast(error
      ? { title: 'Could not save', description: error.message, variant: 'destructive' }
      : { title: 'Profile updated' });
  };

  if (!user) return <AppLayout><div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Sign in to view settings</div></AppLayout>;

  const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
    { id: 'account', label: 'Account', icon: <User className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'verification', label: 'Verification', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-6">
          <Avatar className="w-12 h-12 rounded-full ring-2 ring-border">
            <AvatarImage src={avatarUrl || ''} />
            <AvatarFallback className="bg-secondary font-bold">{(displayName || user.email || 'U')[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-xl font-black truncate">{displayName || user.email?.split('@')[0]}</h1>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <div className="flex bg-secondary rounded-2xl p-1 mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl transition-colors ${tab === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab === t.id && <motion.span layoutId="settingsTab" className="absolute inset-0 bg-card rounded-xl shadow" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative flex items-center gap-1.5">{t.icon}{t.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            {tab === 'account' && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <h2 className="font-bold">Account</h2>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input value={user.email || ''} readOnly className="mt-1 bg-secondary border-0 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Username</Label>
                  <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="your_username" className="mt-1 bg-secondary border-0 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Display Name</Label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your Name" className="mt-1 bg-secondary border-0 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Bio</Label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell people about yourself..." className="mt-1 bg-secondary border-0 rounded-xl" />
                </div>
                <Button onClick={saveProfile} disabled={saving || !username.trim() || !displayName.trim()} className="w-full rounded-xl">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="ghost" onClick={signOut} className="w-full rounded-xl text-destructive hover:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />Sign out
                </Button>
              </div>
            )}

            {tab === 'appearance' && <AppearanceSection />}
            {tab === 'verification' && <VerificationSection userId={user.id} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

function AppearanceSection() {
  const [cursor, setCursor] = useState(getCursorEnabled());
  const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
      <h2 className="font-bold">Appearance</h2>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-sm">Theme</p>
          <p className="text-xs text-muted-foreground mt-1">Switch between light and dark.</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex items-start justify-between gap-4 border-t border-border pt-5">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <MousePointer2 className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm">Custom animated cursor</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Replace your system cursor with the SIGMA spinning target. Disabled automatically on touch devices.
          </p>
        </div>
        <Switch checked={cursor} disabled={isTouch} onCheckedChange={(v) => { setCursor(v); setCursorEnabled(v); }} />
      </div>
      {isTouch && <p className="text-xs text-amber-500">Custom cursor is disabled on touch devices.</p>}
    </div>
  );
}

function VerificationSection({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.from('feedback').select('id').eq('user_id', userId).eq('category', 'verification').limit(1)
      .then(({ data }) => setRequested((data || []).length > 0));
  }, [userId]);

  const submit = async () => {
    setSubmitting(true);
    const { error } = await supabase.from('feedback').insert({
      user_id: userId, category: 'verification', rating: 5, message: message.trim() || 'Verification request',
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Could not submit', description: error.message, variant: 'destructive' });
      return;
    }
    setRequested(true);
    setMessage('');
    toast({ title: 'Verification requested', description: 'Our team will review your request.' });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <h2 className="font-bold">Verification</h2>
      {requested ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-bold">Request submitted</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your verification request is under review.</p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Tell us why your account should be verified. Requests are reviewed manually.
          </p>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Links, audience size, why you're notable..." className="bg-secondary border-0 rounded-xl" />
          <Button onClick={submit} disabled={submitting} className="w-full rounded-xl">
            {submitting ? 'Submitting...' : 'Request verification'}
          </Button>
        </>
      )}
    </div>
  );
}
