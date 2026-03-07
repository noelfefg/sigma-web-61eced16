import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export function SuggestedUsers() {
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .limit(3);
      if (data) setUsers(data);
    }
    fetch();
  }, []);

  if (users.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-5 space-y-4"
    >
      <h3 className="text-sm font-bold text-foreground">Suggested for you</h3>
      <div className="space-y-3">
        {users.map((u, i) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <Link to={`/channel/${u.username}`}>
              <Avatar className="w-9 h-9">
                <AvatarImage src={u.avatar_url || ''} />
                <AvatarFallback className="bg-secondary text-xs">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/channel/${u.username}`}>
                <p className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors">{u.display_name}</p>
              </Link>
              <p className="text-[11px] text-muted-foreground">@{u.username}</p>
            </div>
            <Button size="sm" className="rounded-full text-xs h-7 px-4">
              Follow
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
