import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image, X, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CreatePostDialogProps {
  onPostCreated: () => void;
}

export function CreatePostDialog({ onPostCreated }: CreatePostDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected]);
    selected.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeFile = (i: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!user || (!content.trim() && files.length === 0)) return;
    setLoading(true);

    try {
      const mediaUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('post-media').upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(path);
        mediaUrls.push(urlData.publicUrl);
      }

      const postType = mediaUrls.length > 0 ? 'image' : 'text';
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim() || null,
        media_urls: mediaUrls,
        post_type: postType,
      });

      if (error) throw error;

      toast({ title: 'Post shared!' });
      setContent('');
      setFiles([]);
      setPreviews([]);
      setOpen(false);
      onPostCreated();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 h-9 text-[15px]">
          Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border/50 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={e => setContent(e.target.value)}
            className="min-h-[100px] bg-secondary/50 border-border/50 rounded-xl resize-none"
          />

          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} />

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()} className="text-muted-foreground gap-2 rounded-xl">
              <Image className="w-5 h-5" />
              Add Media
            </Button>
            <Button onClick={handleSubmit} disabled={loading || (!content.trim() && files.length === 0)} className="rounded-full px-6 bg-gradient-to-r from-primary to-primary/70">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Share'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
