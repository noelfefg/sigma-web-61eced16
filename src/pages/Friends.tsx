import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, Check, X, Users, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Tab = 'friends' | 'requests' | 'suggested' | 'search';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export default function FriendsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [suggested, setSuggested] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFriends = useCallback(async () => {
    if (!user) return;
    const { data: rows } = await (supabase as any).from('friendships').select('requester_id, addressee_id, status').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).eq('status', 'accepted');
    const ids = (rows || []).map((r: any) => r.requester_id === user.id ? r.addressee_id : r.requester_id);
    if (!ids.length) { setFriends([]); return; }
    const { data: profs } = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', ids);
    setFriends(profs || []);
  }, [user]);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase as any).from('friendships').select('id, requester_id, status, created_at').eq('addressee_id', user.id).eq('status', 'pending');
    if (!data?.length) { setRequests([]); return; }
    const ids = data.map((r: any) => r.requester_id);
    const { data: profs } = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', ids);
    const byId = Object.fromEntries((profs || []).map((p: any) => [p.id, p]));
    setRequests(data.map((r: any) => ({ ...r, profile: byId[r.requester_id] })));
  }, [user]);

  const loadSuggested = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Simple suggestion: people followed by people you follow, exclude existing friends/self
    const { data: myFollowing } = await supabase.from('followers').select('following_id').eq('follower_id', user.id);
    const followingIds = (myFollowing || []).map((f: any) => f.following_id);
    if (!followingIds.length) {
      // Fallback: top creators by follower count
      const { data: top } = await (supabase as any).from('user_ranks').select('user_id, username, display_name, avatar_url').neq('user_id', user.id).order('score', { ascending: false }).limit(20);
      setSuggested((top || []).map((t: any) => ({ id: t.user_id, username: t.username, display_name: t.display_name, avatar_url: t.avatar_url })));
      setLoading(false);
      return;
    }
    const { data: foaf } = await supabase.from('followers').select('following_id').in('follower_id', followingIds).limit(200);
    const counts: Record<string, number> = {};
    (foaf || []).forEach((f: any) => { if (f.following_id !== user.id) counts[f.following_id] = (counts[f.following_id] || 0) + 1; });
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([id]) => id);
    if (!ranked.length) { setSuggested([]); setLoading(false); return; }
    const { data: profs } = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', ranked);
    setSuggested(profs || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (tab === 'friends') loadFriends();
    if (tab === 'requests') loadRequests();
    if (tab === 'suggested') loadSuggested();
  }, [tab, loadFriends, loadRequests, loadSuggested]);

  const doSearch = async () => {
    if (!searchTerm.trim()) return;
    const term = `%${searchTerm.trim()}%`;
    const { data } = await supabase.from('profiles').select('id, username, display_name, avatar_url').or(`username.ilike.${term},display_name.ilike.${term}`).limit(30);
    setSearchResults(data || []);
  };

  const sendRequest = async (otherId: string) => {
    if (!user) return;
    const { error } = await (supabase as any).from('friendships').insert({ requester_id: user.id, addressee_id: otherId, status: 'pending' });
    if (error) toast({ title: 'Could not send', description: error.message, variant: 'destructive' });
    else toast({ title: 'Friend request sent' });
  };

  const respond = async (id: string, accept: boolean) => {
    if (accept) {
      await (supabase as any).from('friendships').update({ status: 'accepted' }).eq('id', id);
    } else {
      await (supabase as any).from('friendships').delete().eq('id', id);
    }
    loadRequests();
    if (accept) loadFriends();
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'requests', label: 'Requests', icon: UserPlus },
    { id: 'suggested', label: 'Suggested', icon: Sparkles },
    { id: 'search', label: 'Search', icon: Search },
  ];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-black mb-4">Friends</h1>

        <div className="flex bg-secondary rounded-2xl p-1 mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${tab === t.id ? 'bg-card text-foreground shadow' : 'text-muted-foreground'}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {tab === 'search' && (
          <div className="mb-4 flex gap-2">
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by username or name…" onKeyDown={(e) => e.key === 'Enter' && doSearch()} />
            <Button onClick={doSearch}><Search className="w-4 h-4" /></Button>
          </div>
        )}

        <div className="space-y-2">
          {tab === 'friends' && friends.map((p) => <UserRow key={p.id} profile={p} />)}
          {tab === 'friends' && friends.length === 0 && <Empty label="No friends yet — try the Suggested tab." />}

          {tab === 'requests' && requests.map((r) => (
            <div key={r.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
              <Avatar><AvatarImage src={r.profile?.avatar_url || ''} /><AvatarFallback>{r.profile?.username?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{r.profile?.display_name || r.profile?.username}</p>
                <p className="text-xs text-muted-foreground truncate">@{r.profile?.username}</p>
              </div>
              <Button size="sm" onClick={() => respond(r.id, true)}><Check className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => respond(r.id, false)}><X className="w-4 h-4" /></Button>
            </div>
          ))}
          {tab === 'requests' && requests.length === 0 && <Empty label="No pending requests." />}

          {tab === 'suggested' && (loading ? <Empty label="Finding people…" /> : suggested.map((p) => <UserRow key={p.id} profile={p} onAdd={() => sendRequest(p.id)} />))}
          {tab === 'suggested' && !loading && suggested.length === 0 && <Empty label="No suggestions right now." />}

          {tab === 'search' && searchResults.map((p) => <UserRow key={p.id} profile={p} onAdd={() => sendRequest(p.id)} />)}
          {tab === 'search' && searchResults.length === 0 && searchTerm && <Empty label="No matches." />}
        </div>
      </div>
    </AppLayout>
  );
}

function UserRow({ profile, onAdd }: { profile: Profile; onAdd?: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
      <Avatar><AvatarImage src={profile.avatar_url || ''} /><AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
      <Link to={`/profile/${profile.username}`} className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{profile.display_name || profile.username}</p>
        <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
      </Link>
      {onAdd && <Button size="sm" onClick={onAdd}><UserPlus className="w-4 h-4 mr-1" />Add</Button>}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground text-center py-8">{label}</p>;
}
