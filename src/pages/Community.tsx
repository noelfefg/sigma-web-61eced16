import { useState, useEffect } from 'react';
import { Users, Plus, Search, X, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  banner_url: string | null;
  creator_id: string;
  member_count: number;
  created_at: string;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    if (user) fetchJoined();
  }, [user]);

  async function fetchCommunities() {
    setLoading(true);
    const { data } = await supabase
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false });
    if (data) setCommunities(data);
    setLoading(false);
  }

  async function fetchJoined() {
    if (!user) return;
    const { data } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id);
    if (data) setJoinedIds(new Set(data.map(d => d.community_id)));
  }

  async function handleCreate() {
    if (!user || !name.trim()) return;
    setCreating(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { error } = await supabase.from('communities').insert({
      name: name.trim(),
      slug,
      description: description.trim() || null,
      creator_id: user.id,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      // Auto-join the community
      const { data: newComm } = await supabase.from('communities').select('id').eq('slug', slug).maybeSingle();
      if (newComm) {
        await supabase.from('community_members').insert({ community_id: newComm.id, user_id: user.id });
      }
      toast({ title: 'Community created!' });
      setCreateOpen(false);
      setName('');
      setDescription('');
      fetchCommunities();
      fetchJoined();
    }
    setCreating(false);
  }

  async function toggleJoin(communityId: string) {
    if (!user) return;
    if (joinedIds.has(communityId)) {
      await supabase.from('community_members').delete().eq('community_id', communityId).eq('user_id', user.id);
      setJoinedIds(prev => { const s = new Set(prev); s.delete(communityId); return s; });
    } else {
      await supabase.from('community_members').insert({ community_id: communityId, user_id: user.id });
      setJoinedIds(prev => new Set(prev).add(communityId));
    }
  }

  const filtered = communities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Communities</h1>
            <p className="text-sm text-muted-foreground mt-1">Find and join communities that match your interests</p>
          </div>
          {user ? (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Create Community</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a Community</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Community name" value={name} onChange={e => setName(e.target.value)} />
                  <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                  <Button onClick={handleCreate} disabled={!name.trim() || creating} className="w-full">
                    {creating ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Link to="/auth"><Button><LogIn className="w-4 h-4 mr-2" />Sign In</Button></Link>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            className="pl-10 bg-card"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              {searchQuery ? 'No communities found' : 'No communities yet'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search' : 'Be the first to create one!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((community, i) => (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl overflow-hidden hover:shadow-md transition-all group"
              >
                {/* Banner */}
                <div className="h-24 bg-gradient-to-br from-primary/20 via-secondary to-accent/20">
                  {community.banner_url && (
                    <img src={community.banner_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="p-4 -mt-6">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-lg font-bold text-foreground mb-3">
                    {community.icon_url ? (
                      <img src={community.icon_url} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      community.name[0]?.toUpperCase()
                    )}
                  </div>

                  <h3 className="font-semibold text-foreground truncate">{community.name}</h3>
                  {community.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{community.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-muted-foreground">
                      <Users className="w-3 h-3 inline mr-1" />
                      {community.member_count} members
                    </span>
                    {user && (
                      <Button
                        variant={joinedIds.has(community.id) ? 'secondary' : 'default'}
                        size="sm"
                        className="rounded-full text-xs"
                        onClick={() => toggleJoin(community.id)}
                      >
                        {joinedIds.has(community.id) ? 'Joined' : 'Join'}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
