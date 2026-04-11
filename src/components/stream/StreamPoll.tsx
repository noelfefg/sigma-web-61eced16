import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Plus, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Poll {
  id: string;
  question: string;
  options: string[];
  is_active: boolean;
}

interface PollVoteCounts {
  [optionIndex: number]: number;
}

interface StreamPollProps {
  streamId: string;
  isOwner: boolean;
}

export function StreamPoll({ streamId, isOwner }: StreamPollProps) {
  const { user } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [votes, setVotes] = useState<PollVoteCounts>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  useEffect(() => {
    fetchPoll();
    const channel = supabase
      .channel(`poll-${streamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stream_polls', filter: `stream_id=eq.${streamId}` }, () => fetchPoll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stream_poll_votes' }, () => fetchVotes())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [streamId]);

  async function fetchPoll() {
    const { data } = await supabase
      .from('stream_polls')
      .select('*')
      .eq('stream_id', streamId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setPoll({ ...data, options: (data.options as any) || [] });
      fetchVotes(data.id);
    } else {
      setPoll(null);
    }
  }

  async function fetchVotes(pollId?: string) {
    const id = pollId || poll?.id;
    if (!id) return;
    const { data } = await supabase.from('stream_poll_votes').select('option_index, user_id').eq('poll_id', id);
    if (data) {
      const counts: PollVoteCounts = {};
      data.forEach((v: any) => { counts[v.option_index] = (counts[v.option_index] || 0) + 1; });
      setVotes(counts);
      setTotalVotes(data.length);
      if (user) {
        const uv = data.find((v: any) => v.user_id === user.id);
        setUserVote(uv ? uv.option_index : null);
      }
    }
  }

  async function handleVote(index: number) {
    if (!user || !poll || userVote !== null) return;
    setUserVote(index);
    await supabase.from('stream_poll_votes').insert({ poll_id: poll.id, user_id: user.id, option_index: index });
    fetchVotes();
  }

  async function handleCreatePoll() {
    if (!question.trim() || options.filter(o => o.trim()).length < 2) return;
    const filtered = options.filter(o => o.trim());
    await supabase.from('stream_polls').insert({
      stream_id: streamId,
      question: question.trim(),
      options: filtered,
    });
    setCreating(false);
    setQuestion('');
    setOptions(['', '']);
    fetchPoll();
  }

  async function handleEndPoll() {
    if (!poll) return;
    await supabase.from('stream_polls').update({ is_active: false, ended_at: new Date().toISOString() }).eq('id', poll.id);
    setPoll(null);
  }

  if (creating && isOwner) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Create Poll</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCreating(false)}><X className="w-4 h-4" /></Button>
        </div>
        <Input placeholder="Ask a question..." value={question} onChange={e => setQuestion(e.target.value)} className="bg-secondary/50 text-sm h-9" />
        {options.map((opt, i) => (
          <Input key={i} placeholder={`Option ${i + 1}`} value={opt} onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} className="bg-secondary/50 text-sm h-9" />
        ))}
        {options.length < 4 && (
          <Button variant="ghost" size="sm" onClick={() => setOptions([...options, ''])} className="text-xs"><Plus className="w-3 h-3 mr-1" />Add option</Button>
        )}
        <Button onClick={handleCreatePoll} className="w-full" size="sm" disabled={!question.trim() || options.filter(o => o.trim()).length < 2}>Start Poll</Button>
      </motion.div>
    );
  }

  if (!poll) {
    if (isOwner) {
      return (
        <Button variant="outline" size="sm" onClick={() => setCreating(true)} className="gap-1.5">
          <BarChart3 className="w-4 h-4" />Create Poll
        </Button>
      );
    }
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">{poll.question}</h3>
        {isOwner && <Button variant="ghost" size="sm" onClick={handleEndPoll} className="text-xs text-muted-foreground">End Poll</Button>}
      </div>
      <div className="space-y-2">
        {poll.options.map((opt, i) => {
          const count = votes[i] || 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isVoted = userVote === i;
          return (
            <motion.button
              key={i}
              onClick={() => handleVote(i)}
              disabled={userVote !== null || !user}
              className={`w-full relative overflow-hidden rounded-xl border text-left px-4 py-2.5 text-sm transition-all ${
                isVoted ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/30'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              {userVote !== null && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 bg-primary/15 rounded-xl"
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className="font-medium text-foreground flex items-center gap-2">
                  {isVoted && <Check className="w-3.5 h-3.5 text-primary" />}
                  {opt}
                </span>
                {userVote !== null && <span className="text-xs text-muted-foreground font-bold">{pct}%</span>}
              </div>
            </motion.button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
    </motion.div>
  );
}
