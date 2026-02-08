import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Settings, 
  Wifi, 
  Copy, 
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function GoLivePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [currentStream, setCurrentStream] = useState<{ id: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mock stream key for demo
  const streamKey = user ? `live_${user.id.slice(0, 8)}_${Date.now().toString(36)}` : '';
  const rtmpUrl = 'rtmp://live.sigma.tv/live';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');
      
      if (data) {
        setCategories(data);
      }
    }

    async function fetchCurrentStream() {
      if (!user) return;
      
      const { data } = await supabase
        .from('streams')
        .select('id, title, description, category_id, is_live')
        .eq('user_id', user.id)
        .eq('is_live', true)
        .maybeSingle();
      
      if (data) {
        setCurrentStream({ id: data.id });
        setTitle(data.title);
        setDescription(data.description || '');
        setCategoryId(data.category_id || '');
        setIsLive(true);
      }
    }

    fetchCategories();
    fetchCurrentStream();
  }, [user]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  const handleGoLive = async () => {
    if (!user || !title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a stream title',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('streams')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          category_id: categoryId || null,
          is_live: true,
          started_at: new Date().toISOString(),
          viewer_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentStream({ id: data.id });
      setIsLive(true);
      toast({
        title: 'You are now live!',
        description: 'Your stream has started',
      });
    } catch (error) {
      console.error('Error starting stream:', error);
      toast({
        title: 'Error',
        description: 'Failed to start stream',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndStream = async () => {
    if (!currentStream) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('streams')
        .update({
          is_live: false,
          ended_at: new Date().toISOString(),
        })
        .eq('id', currentStream.id);

      if (error) throw error;

      setIsLive(false);
      setCurrentStream(null);
      setTitle('');
      setDescription('');
      setCategoryId('');
      toast({
        title: 'Stream ended',
        description: 'Your stream has been ended',
      });
    } catch (error) {
      console.error('Error ending stream:', error);
      toast({
        title: 'Error',
        description: 'Failed to end stream',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStream = async () => {
    if (!currentStream || !title.trim()) return;

    try {
      const { error } = await supabase
        .from('streams')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          category_id: categoryId || null,
        })
        .eq('id', currentStream.id);

      if (error) throw error;

      toast({
        title: 'Stream updated',
        description: 'Your stream info has been updated',
      });
    } catch (error) {
      console.error('Error updating stream:', error);
      toast({
        title: 'Error',
        description: 'Failed to update stream',
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Go Live</h1>
            <p className="text-muted-foreground">Configure and start your stream</p>
          </div>
          <div className="flex items-center gap-2">
            {isLive ? (
              <div className="flex items-center gap-2 text-destructive">
                <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                <span className="font-semibold">LIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 bg-muted-foreground rounded-full" />
                <span>Offline</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Stream Settings */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Stream Settings</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Stream Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter your stream title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell viewers what your stream is about..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-secondary border-border min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLive ? (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleUpdateStream}
                    disabled={isSubmitting || !title.trim()}
                    className="flex-1"
                    variant="secondary"
                  >
                    Update Stream
                  </Button>
                  <Button
                    onClick={handleEndStream}
                    disabled={isSubmitting}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    End Stream
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleGoLive}
                  disabled={isSubmitting || !title.trim()}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Video className="w-4 h-4 mr-2" />
                  )}
                  Go Live
                </Button>
              )}
            </div>
          </div>

          {/* Stream Key & Server */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Wifi className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Stream Connection</h2>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-500">Keep your stream key private!</p>
                    <p className="text-muted-foreground">
                      Never share your stream key with anyone. Anyone with this key can stream to your channel.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Server URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={rtmpUrl}
                    readOnly
                    className="bg-secondary border-border font-mono text-sm"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => copyToClipboard(rtmpUrl, 'Server URL')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Stream Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showStreamKey ? 'text' : 'password'}
                      value={streamKey}
                      readOnly
                      className="bg-secondary border-border font-mono text-sm pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowStreamKey(!showStreamKey)}
                    >
                      {showStreamKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => copyToClipboard(streamKey, 'Stream Key')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Guide */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Quick Setup Guide</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                  <span>Open your streaming software (OBS, Streamlabs, etc.)</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                  <span>Go to Settings → Stream and select "Custom" service</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                  <span>Paste the Server URL and Stream Key from above</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                  <span>Click "Go Live" above, then start streaming in your software</span>
                </li>
              </ol>
              
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-muted-foreground">Recommended: 1080p @ 60fps, 6000 kbps bitrate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
