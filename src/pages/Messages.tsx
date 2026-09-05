import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Search, Send, Plus, ArrowLeft, Users, UserPlus,
  Check, CheckCheck, Smile, MoreVertical, Phone, Video, ImageIcon
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { format, isToday, isYesterday } from 'date-fns';
import { Message, MessageAvatar, MessageContent, Bubble, BubbleContent, MessageFooter } from '@/components/messaging/Bubble';

interface Conversation {
  id: string;
  updated_at: string;
  participants: { id: string; username: string; display_name: string; avatar_url: string | null }[];
  last_message?: { content: string; created_at: string; sender_id: string };
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

function formatMessageTime(date: string) {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedConversation = conversations.find(c => c.id === selectedConv);
  const otherParticipant = selectedConversation?.participants.find(p => p.id !== user?.id);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  // Subscribe to new messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('dm-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
      }, (payload) => {
        const msg = payload.new as Message;
        if (msg.conversation_id === selectedConv) {
          setMessages(prev => [...prev, msg]);
          scrollToBottom();
        }
        loadConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, selectedConv]);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv);
    }
  }, [selectedConv]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  async function loadConversations() {
    if (!user) return;
    setLoading(true);

    // Get user's conversation IDs
    const { data: participantData } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (!participantData?.length) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convIds = participantData.map(p => p.conversation_id);

    // Get conversations
    const { data: convData } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    if (!convData) { setLoading(false); return; }

    // Build conversation objects with participants and last message
    const convs: Conversation[] = [];
    for (const conv of convData) {
      const { data: parts } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conv.id);

      const userIds = parts?.map(p => p.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      const { data: lastMsg } = await supabase
        .from('direct_messages')
        .select('content, created_at, sender_id')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const { count } = await supabase
        .from('direct_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', user.id)
        .is('read_at', null);

      convs.push({
        id: conv.id,
        updated_at: conv.updated_at,
        participants: profiles || [],
        last_message: lastMsg?.[0] || undefined,
        unread_count: count || 0,
      });
    }

    setConversations(convs);
    setLoading(false);
  }

  async function loadMessages(convId: string) {
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    setMessages(data || []);

    // Mark as read
    if (user) {
      await supabase
        .from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', convId)
        .neq('sender_id', user.id)
        .is('read_at', null);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || !user || sending) return;
    setSending(true);

    const { error } = await supabase.from('direct_messages').insert({
      conversation_id: selectedConv,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    if (!error) {
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', selectedConv);
      setNewMessage('');
      inputRef.current?.focus();
    } else {
      toast({ title: 'Failed to send', description: error.message, variant: 'destructive' });
    }
    setSending(false);
  }

  async function searchUsers(query: string) {
    setUserSearch(query);
    if (query.length < 2) { setSearchResults([]); return; }

    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .neq('id', user?.id || '')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10);

    setSearchResults(data || []);
  }

  async function startConversation(otherUserId: string) {
    if (!user) return;

    // Check if conversation already exists
    const { data: myConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (myConvs) {
      for (const mc of myConvs) {
        const { data: otherPart } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', mc.conversation_id)
          .eq('user_id', otherUserId);

        if (otherPart?.length) {
          setSelectedConv(mc.conversation_id);
          setShowNewChat(false);
          setMobileShowChat(true);
          return;
        }
      }
    }

    // Create new conversation
    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (error || !conv) {
      toast({ title: 'Error', description: 'Failed to create conversation', variant: 'destructive' });
      return;
    }

    await supabase.from('conversation_participants').insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: otherUserId },
    ]);

    await loadConversations();
    setSelectedConv(conv.id);
    setShowNewChat(false);
    setMobileShowChat(true);
  }

  function scrollToBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    return c.participants.some(p =>
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Sign in to message</h2>
          <p className="text-muted-foreground text-center max-w-sm">Connect with other users, followers, and streamers through direct messages.</p>
          <Link to="/auth">
            <Button size="lg" className="rounded-full px-8">Sign In</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden">
        {/* Conversations List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`w-full md:w-80 lg:w-96 bg-card/50 backdrop-blur-xl flex flex-col border-r border-border/30 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}
        >
          {/* Header */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-foreground">Messages</h1>
              <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="rounded-full h-9 w-9 bg-primary/10 hover:bg-primary/20 text-primary">
                    <Plus className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card/95 backdrop-blur-2xl border-border/30 rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-lg">New Message</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => searchUsers(e.target.value)}
                        className="pl-10 bg-secondary/60 rounded-xl border-0 h-11"
                      />
                    </div>
                    <ScrollArea className="max-h-72">
                      <div className="space-y-1">
                        {searchResults.map(u => (
                          <motion.button
                            key={u.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => startConversation(u.id)}
                            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-accent/50 transition-all"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={u.avatar_url || ''} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent text-sm font-semibold">
                                {u.display_name[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                              <p className="text-sm font-semibold text-foreground">{u.display_name}</p>
                              <p className="text-xs text-muted-foreground">@{u.username}</p>
                            </div>
                            <UserPlus className="w-4 h-4 text-primary ml-auto" />
                          </motion.button>
                        ))}
                        {userSearch.length >= 2 && searchResults.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-6">No users found</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/40 rounded-xl border-0 h-10 text-sm"
              />
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            <div className="px-2 pb-2">
              <AnimatePresence>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                      <div className="w-12 h-12 bg-secondary rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-secondary rounded-full w-24" />
                        <div className="h-3 bg-secondary/60 rounded-full w-36" />
                      </div>
                    </div>
                  ))
                ) : filteredConversations.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center py-16 gap-3"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
                      <MessageSquare className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => setShowNewChat(true)}>
                      <Plus className="w-4 h-4 mr-1" /> Start chatting
                    </Button>
                  </motion.div>
                ) : (
                  filteredConversations.map((conv, i) => {
                    const other = conv.participants.find(p => p.id !== user.id);
                    const isSelected = selectedConv === conv.id;
                    return (
                      <motion.button
                        key={conv.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => { setSelectedConv(conv.id); setMobileShowChat(true); }}
                        className={`flex items-center gap-3 w-full p-3 rounded-2xl transition-all duration-200 group mb-0.5 ${
                          isSelected
                            ? 'bg-primary/10 ring-1 ring-primary/20'
                            : 'hover:bg-accent/40'
                        }`}
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={other?.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent font-semibold">
                              {other?.display_name?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          {conv.unread_count > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center ring-2 ring-card">
                              {conv.unread_count > 9 ? '9+' : conv.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-semibold truncate ${conv.unread_count > 0 ? 'text-foreground' : 'text-foreground/80'}`}>
                              {other?.display_name || 'Unknown'}
                            </p>
                            {conv.last_message && (
                              <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
                                {formatMessageTime(conv.last_message.created_at)}
                              </span>
                            )}
                          </div>
                          {conv.last_message && (
                            <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? 'text-foreground/70 font-medium' : 'text-muted-foreground'}`}>
                              {conv.last_message.sender_id === user.id ? 'You: ' : ''}
                              {conv.last_message.content}
                            </p>
                          )}
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </motion.div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          {selectedConv && otherParticipant ? (
            <>
              {/* Chat Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-16 px-4 flex items-center justify-between bg-card/60 backdrop-blur-xl border-b border-border/20"
              >
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8 rounded-full"
                    onClick={() => setMobileShowChat(false)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={otherParticipant.avatar_url || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent text-sm font-semibold">
                      {otherParticipant.display_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{otherParticipant.display_name}</p>
                    <p className="text-[11px] text-muted-foreground">@{otherParticipant.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-3">
                <div className="space-y-3 max-w-3xl mx-auto">
                  {messages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center py-20 gap-3"
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <MessageSquare className="w-7 h-7 text-primary/60" />
                      </div>
                      <p className="text-sm text-muted-foreground">Start a conversation with {otherParticipant.display_name}</p>
                    </motion.div>
                  )}
                  <AnimatePresence>
                    {messages.map((msg, i) => {
                      const isMe = msg.sender_id === user.id;
                      const grouped = i > 0 && messages[i - 1].sender_id === msg.sender_id;
                      return (
                        <Message key={msg.id} variant={isMe ? 'outgoing' : 'incoming'} grouped={grouped}>
                          <MessageAvatar
                            src={isMe ? null : otherParticipant.avatar_url}
                            name={isMe ? 'You' : otherParticipant.display_name}
                            hidden={grouped}
                          />
                          <MessageContent>
                            <Bubble variant={isMe ? 'outgoing' : 'incoming'} grouped={grouped}>
                              <BubbleContent>{msg.content}</BubbleContent>
                            </Bubble>
                            <MessageFooter
                              variant={isMe ? 'outgoing' : 'incoming'}
                              timestamp={format(new Date(msg.created_at), 'h:mm a')}
                              state={isMe ? (msg.read_at ? 'read' : 'sent') : undefined}
                            />
                          </MessageContent>
                        </Message>
                      );
                    })}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 bg-card/40 backdrop-blur-xl border-t border-border/20">
                <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex items-center gap-2">
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground flex-shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="bg-secondary/50 rounded-full border-0 h-11 pr-12 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-muted-foreground"
                    >
                      <Smile className="w-5 h-5" />
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim() || sending}
                    className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 flex-shrink-0 shadow-lg shadow-primary/25"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-4"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <MessageSquare className="w-12 h-12 text-primary/40" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Your Messages</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">Send private messages to your friends, followers, and favorite streamers</p>
              </div>
              <Button className="rounded-full px-6" onClick={() => setShowNewChat(true)}>
                <Plus className="w-4 h-4 mr-2" /> New Message
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
