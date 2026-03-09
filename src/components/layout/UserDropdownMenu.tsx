import { Link } from 'react-router-dom';
import { 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Wallet, 
  LayoutDashboard,
  Radio,
  Moon,
  Sun,
  Crown,
  Gift
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface UserDropdownMenuProps {
  user: { email?: string };
  signOut: () => void;
  avatarUrl?: string | null;
}

export function UserDropdownMenu({ user, signOut, avatarUrl }: UserDropdownMenuProps) {
  const { theme, setTheme } = useTheme();
  const username = user.email?.split('@')[0] || 'user';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-9 h-9 rounded-full flex items-center justify-center ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300 focus:outline-none overflow-hidden">
          <Avatar className="w-9 h-9">
            <AvatarImage src={avatarUrl || ''} />
            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent text-primary text-xs">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-xl border-border/50 rounded-xl p-1">
        <div className="px-3 py-2.5 flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatarUrl || ''} />
            <AvatarFallback className="bg-gradient-to-br from-primary/40 to-accent text-primary text-sm">
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{username}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-border/50" />
        
        <DropdownMenuItem asChild>
          <Link to={`/channel/${username}`} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer">
            <Radio className="w-4 h-4 text-muted-foreground" />
            <span>Channel</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/go-live" className="flex items-center gap-2.5 px-3 py-2 cursor-pointer">
            <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
            <span>Creator Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/gifts" className="flex items-center gap-2.5 px-3 py-2 cursor-pointer">
            <Gift className="w-4 h-4 text-muted-foreground" />
            <span>Drops & Rewards</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-border/50" />
        
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2 cursor-pointer">
            <Crown className="w-4 h-4 text-muted-foreground" />
            <span>Subscriptions</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2 cursor-pointer">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span>Wallet</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-border/50" />
        
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2 cursor-pointer">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2 cursor-pointer">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span>Privacy Center</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-border/50" />
        
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm">Dark Theme</span>
          </div>
          <Switch 
            checked={theme === 'dark'} 
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            className="scale-75"
          />
        </div>
        
        <DropdownMenuSeparator className="bg-border/50" />
        
        <DropdownMenuItem onClick={signOut} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
