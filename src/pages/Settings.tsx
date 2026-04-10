import { LordIcon, ICONS } from '@/components/ui/LordIcon';
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CreditCard, User, CheckCircle2, Clock, AlertCircle, Upload, FileText } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LottieIcon, LottieEmptyState } from '@/components/animations/LottieIcon';
import { RelationshipStatusEditor } from '@/components/shared/RelationshipStatus';

type KYCStatus = 'none' | 'pending' | 'approved' | 'rejected';
type Tab = 'kyc' | 'settings';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('settings');
  const [kycStatus, setKycStatus] = useState<KYCStatus>('none');
  const [kycLoading, setKycLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
      .then(({ data }) => setAvatarUrl(data?.avatar_url || null));
  }, [user]);

  const submitKYC = async () => {
    setKycLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setKycStatus('pending');
    setKycLoading(false);
    toast({ title: 'KYC submitted', description: 'We will review your documents within 24-48 hours.' });
  };

  if (!user) return <AppLayout><div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Sign in to view settings</div></AppLayout>;

  const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
    { id: 'settings', label: 'Account', icon: <LordIcon icon={ICONS.user} size={20} trigger="hover" primary="6b7280" className="w-4 h-4" /> },
    { id: 'kyc', label: 'Verification', icon: <LordIcon icon={ICONS.shield} size={20} trigger="hover" primary="6b7280" className="w-4 h-4" /> },
  ];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Avatar className="w-12 h-12 rounded-full ring-2 ring-border">
            <AvatarImage src={avatarUrl || ''} />
            <AvatarFallback className="bg-secondary font-bold">{user.email?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-black">{user.email?.split('@')[0]}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-secondary rounded-2xl p-1 mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl transition-all ${tab === t.id ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* KYC tab */}
        {tab === 'kyc' && (
          <div className="space-y-4">
            {/* Status banner */}
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
              kycStatus === 'approved' ? 'bg-green-500/10 border-green-500/20' :
              kycStatus === 'pending' ? 'bg-amber-500/10 border-amber-500/20' :
              kycStatus === 'rejected' ? 'bg-red-500/10 border-red-500/20' :
              'bg-primary/10 border-primary/20'
            }`}>
              {kycStatus === 'approved' ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> :
               kycStatus === 'pending' ? <Clock className="w-5 h-5 text-amber-500 shrink-0" /> :
               kycStatus === 'rejected' ? <AlertCircle className="w-5 h-5 text-red-500 shrink-0" /> :
               <LordIcon icon={ICONS.shield} size={20} trigger="hover" primary="6b7280" className="w-5 h-5 text-primary shrink-0" />}
              <div>
                <p className="text-sm font-bold">
                  {kycStatus === 'approved' ? 'Verified Streamer ✓' :
                   kycStatus === 'pending' ? 'Verification Under Review' :
                   kycStatus === 'rejected' ? 'Verification Rejected' :
                   'Identity Verification Required'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {kycStatus === 'approved' ? 'You can now go live and earn on SIGMA' :
                   kycStatus === 'pending' ? 'We\'re reviewing your documents. Usually 24-48 hours.' :
                   kycStatus === 'rejected' ? 'Please resubmit with clearer documents.' :
                   'Complete KYC to unlock streaming and earning features'}
                </p>
              </div>
            </div>

            {kycStatus !== 'approved' && (
              <>
                <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                  <h3 className="font-bold text-sm">What you need</h3>
                  {[
                    { icon: FileText, label: 'Government-issued ID', sub: 'Passport, National ID or Driver\'s License' },
                    { icon: User, label: 'Selfie with ID', sub: 'A photo of you holding your ID' },
                    { icon: Shield, label: 'Proof of address', sub: 'Bank statement or utility bill (last 3 months)' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                  <h3 className="font-bold text-sm">Upload Documents</h3>
                  {['Government ID (Front)', 'Government ID (Back)', 'Selfie with ID'].map(label => (
                    <div key={label}>
                      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
                      <div className="border-2 border-dashed border-border rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                        <Upload className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Tap to upload</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={submitKYC} disabled={kycLoading} className="w-full h-11 rounded-xl font-semibold">
                  {kycLoading ? 'Submitting...' : 'Submit for Verification'}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Account settings tab */}
        {tab === 'settings' && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-bold">Account Settings</h2>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input value={user.email || ''} readOnly className="mt-1 bg-secondary border-0 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Username</Label>
              <Input placeholder="your_username" className="mt-1 bg-secondary border-0 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Display Name</Label>
              <Input placeholder="Your Name" className="mt-1 bg-secondary border-0 rounded-xl" />
            </div>
            <Button className="w-full rounded-xl">Save Changes</Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
