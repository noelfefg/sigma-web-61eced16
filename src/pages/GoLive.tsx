import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Settings, Wifi, Copy, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, Camera, CameraOff, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AIStreamAssistant } from '@/components/stream/AIStreamAssistant';

interface Category { id: string; name: string; slug: string; }

export default function GoLivePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [currentStream, setCurrentStream] = useState<{ id: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [previewActive, setPreviewActive] = useState(false);
  const streamKey = user ? `live_${user.id.slice(0, 8)}_${Date.now().toString(36)}` : '';
  const rtmpUrl = 'rtmp://live.sigma.tv/live';

  useEffect(() => { if (!authLoading && !user) navigate('/auth'); }, [user, authLoading, navigate]);

  useEffect(() => {
    async function init() {
      const [{ data: cats }, { data: stream }] = await Promise.all([
        supabase.from('categories').select('id, name, slug').order('name'),
        user ? supabase.from('streams').select('id, title, description, category_id, is_live').eq('user_id', user.id).eq('is_live', true).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      if (cats) setCategories(cats);
      if (stream) { setCurrentStream({ id: stream.id }); setTitle(stream.title); setDescription(stream.description || ''); setCategoryId(stream.category_id || ''); setIsLive(true); }
    }
    init();
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // CRITICAL: getUserMedia called directly in click handler
  const handleStartPreview = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setPreviewActive(true);
      setCameraOn(true);
      setMicOn(true);
    } catch (error) {
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast({ title: 'Permission denied', description: 'Please allow camera and microphone access in your browser settings.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Could not access camera or microphone.', variant: 'destructive' });
      }
    }
  };

  const handleStopPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setPreviewActive(false);
    setCameraOn(false);
  };

  const toggleCamera = () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOn(videoTrack.enabled);
    }
  };

  const toggleMic = () => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  };

  const copyToClipboard = (text: string, label: string) => { navigator.clipboard.writeText(text); toast({ title: 'Copied!', description: `${label} copied to clipboard` }); };

  const handleGoLive = async () => {
    if (!user || !title.trim()) { toast({ title: 'Error', description: 'Please enter a stream title', variant: 'destructive' }); return; }
    setIsSubmitting(true);

    // Start camera if not already active
    if (!previewActive) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = mediaStream;
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
        setPreviewActive(true);
        setCameraOn(true);
        setMicOn(true);
      } catch {
        toast({ title: 'Camera required', description: 'Please allow camera access to go live.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const { data, error } = await supabase.from('streams').insert({ user_id: user.id, title: title.trim(), description: description.trim() || null, category_id: categoryId || null, is_live: true, started_at: new Date().toISOString(), viewer_count: 0 }).select().single();
      if (error) throw error;
      setCurrentStream({ id: data.id }); setIsLive(true);
      toast({ title: 'You are now live!', description: 'Your stream has started' });
    } catch { toast({ title: 'Error', description: 'Failed to start stream', variant: 'destructive' }); }
    finally { setIsSubmitting(false); }
  };

  const handleEndStream = async () => {
    if (!currentStream) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('streams').update({ is_live: false, ended_at: new Date().toISOString() }).eq('id', currentStream.id);
      if (error) throw error;
      setIsLive(false); setCurrentStream(null); setTitle(''); setDescription(''); setCategoryId('');
      handleStopPreview();
      toast({ title: 'Stream ended' });
    } catch { toast({ title: 'Error', description: 'Failed to end stream', variant: 'destructive' }); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdateStream = async () => {
    if (!currentStream || !title.trim()) return;
    try {
      const { error } = await supabase.from('streams').update({ title: title.trim(), description: description.trim() || null, category_id: categoryId || null }).eq('id', currentStream.id);
      if (error) throw error;
      toast({ title: 'Stream updated' });
    } catch { toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' }); }
  };

  if (authLoading) return <AppLayout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AppLayout>;
  if (!user) return null;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Go Live</h1>
            <p className="text-sm text-muted-foreground">Configure and start your stream</p>
          </div>
          <div className="flex items-center gap-2">
            {isLive ? (
              <div className="flex items-center gap-2 text-destructive"><span className="w-2 h-2 bg-destructive rounded-full animate-pulse" /><span className="font-semibold text-sm">LIVE</span></div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground"><span className="w-2 h-2 bg-muted-foreground rounded-full" /><span className="text-sm">Offline</span></div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Camera Preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-xl overflow-hidden">
              <div className="relative aspect-video bg-secondary/50">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${previewActive && cameraOn ? 'block' : 'hidden'}`}
                  style={{ transform: 'scaleX(-1)' }}
                />
                {(!previewActive || !cameraOn) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                      <Camera className="w-10 h-10 text-muted-foreground" />
                    </div>
                    {!previewActive ? (
                      <>
                        <p className="text-sm text-muted-foreground">Camera preview is off</p>
                        <Button onClick={handleStartPreview} variant="secondary" size="sm">
                          <Camera className="w-4 h-4 mr-2" />Start Preview
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Camera is turned off</p>
                    )}
                  </div>
                )}
                {/* Live indicator */}
                {isLive && (
                  <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-md animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-white rounded-full" /> LIVE
                  </div>
                )}
              </div>
              {/* Controls bar */}
              {previewActive && (
                <div className="flex items-center justify-center gap-2 p-3 bg-card">
                  <Button variant={cameraOn ? 'secondary' : 'destructive'} size="icon" onClick={toggleCamera} className="rounded-full h-10 w-10">
                    {cameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                  </Button>
                  <Button variant={micOn ? 'secondary' : 'destructive'} size="icon" onClick={toggleMic} className="rounded-full h-10 w-10">
                    {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleStopPreview} className="text-muted-foreground text-xs">
                    Stop Preview
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /><h2 className="text-sm font-semibold text-foreground">Stream Settings</h2></div>
              <div className="space-y-2"><Label htmlFor="title" className="text-xs">Stream Title *</Label><Input id="title" placeholder="Enter your stream title..." value={title} onChange={(e) => setTitle(e.target.value)} className="bg-secondary text-sm h-9" /></div>
              <div className="space-y-2"><Label htmlFor="description" className="text-xs">Description</Label><Textarea id="description" placeholder="Tell viewers what your stream is about..." value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary min-h-[80px] text-sm" /></div>
              <div className="space-y-2"><Label className="text-xs">Category</Label><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger className="bg-secondary text-sm h-9"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent>{categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent></Select></div>
              {isLive ? (
                <div className="flex gap-2 pt-2"><Button onClick={handleUpdateStream} disabled={isSubmitting || !title.trim()} className="flex-1" variant="secondary" size="sm">Update</Button><Button onClick={handleEndStream} disabled={isSubmitting} variant="destructive" className="flex-1" size="sm">{isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}End Stream</Button></div>
              ) : (
                <Button onClick={handleGoLive} disabled={isSubmitting || !title.trim()} className="w-full" size="sm">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Video className="w-4 h-4 mr-1" />}Go Live</Button>
              )}
            </div>

            {/* Connection Info */}
            <div className="bg-card rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2"><Wifi className="w-4 h-4 text-primary" /><h2 className="text-sm font-semibold text-foreground">Stream Connection</h2></div>
              <div className="p-3 bg-amber-500/10 rounded-lg"><div className="flex gap-2"><AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /><p className="text-xs text-muted-foreground">Keep your stream key private!</p></div></div>
              <div className="space-y-2"><Label className="text-xs">Server URL</Label><div className="flex gap-2"><Input value={rtmpUrl} readOnly className="bg-secondary font-mono text-xs h-9" /><Button variant="secondary" size="icon" onClick={() => copyToClipboard(rtmpUrl, 'Server URL')} className="h-9 w-9"><Copy className="w-3 h-3" /></Button></div></div>
              <div className="space-y-2"><Label className="text-xs">Stream Key</Label><div className="flex gap-2"><div className="relative flex-1"><Input type={showStreamKey ? 'text' : 'password'} value={streamKey} readOnly className="bg-secondary font-mono text-xs h-9 pr-9" /><Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-9" onClick={() => setShowStreamKey(!showStreamKey)}>{showStreamKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</Button></div><Button variant="secondary" size="icon" onClick={() => copyToClipboard(streamKey, 'Stream Key')} className="h-9 w-9"><Copy className="w-3 h-3" /></Button></div></div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}