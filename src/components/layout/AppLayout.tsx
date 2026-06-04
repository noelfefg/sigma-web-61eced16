import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Users, LogIn, User, Bell, Search, ImageIcon, MessageSquare, UserCircle, Play, Mail, Settings, Menu, X } from 'lucide-react';
import sigmaLogo from '@/assets/sigma-logo.jpeg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserDropdownMenu } from '@/components/layout/UserDropdownMenu';
import { CreateMenu } from '@/components/layout/CreateMenu';
import { NotificationPanel, NotificationBell } from '@/components/notifications/NotificationPanel';
import { useNotifications } from '@/hooks/useNotifications';
import { useSound } from '@/hooks/useSound';
import { motion } from 'framer-motion';

interface AppLayoutProps {
  children: ReactNode;
}

const topNav = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Compass, label: 'Browse', path: '/browse' },
  { icon: Play, label: 'Lil Vids', path: '/shorts' },
  { icon: ImageIcon, label: 'Feed', path: '/feed' },
  { icon: Users, label: 'Following', path: '/following' },
  { icon: UserCircle, label: 'You', path: '/you' },
];

const moreNav = [
  { icon: Mail, label: 'Messages', path: '/messages' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: UserCircle, label: 'You', path: '/you' },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { feedback } = useSound();
  const { unreadCount, requestPushPermission } = useNotifications();

  useEffect(() => { if (user) requestPushPermission(); }, [user, requestPushPermission]);

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
      .then(({ data }) => setAvatarUrl(data?.avatar_url || null));
  }, [user]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Cosmos-style floating pill chrome */}
      <header className="sticky top-0 z-40 px-3 md:px-6 pt-3 md:pt-4 pb-2 bg-gradient-to-b from-background via-background/95 to-transparent">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Left pill: logo + segmented nav */}
          <div className="flex items-center gap-1 bg-card/70 backdrop-blur-xl border border-border rounded-full pl-1.5 pr-1 py-1 shadow-sm">
            <Link to="/" aria-label="SIGMA home" className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden">
              <img src={sigmaLogo} alt="SIGMA" className="w-8 h-8 object-cover" />
            </Link>
            <nav className="hidden md:flex items-center gap-0.5 ml-1">
              {topNav.slice(0, 4).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => feedback('tap', 6)}
                    className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="cosmosPill"
                        className="absolute inset-0 bg-secondary rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center: search pill */}
          <div className="flex-1 max-w-2xl mx-auto hidden md:block">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Try 'live music streams'"
                className="pl-12 pr-4 h-11 w-full bg-card/70 backdrop-blur-xl border border-border rounded-full text-sm focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Right pill: actions */}
          <div className="ml-auto flex items-center gap-1 bg-card/70 backdrop-blur-xl border border-border rounded-full pl-1 pr-1 py-1 shadow-sm">
            <div className="hidden sm:block"><CreateMenu /></div>
            <ThemeToggle />
            {user ? (
              <>
                <Link to="/messages" className="hidden sm:block">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary h-8 w-8">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </Link>
                <NotificationBell onClick={() => { feedback('pop', 8); setNotifOpen(o => !o); }} count={unreadCount} />
                <UserDropdownMenu user={user} signOut={signOut} avatarUrl={avatarUrl} />
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="rounded-full font-semibold h-8 px-4">
                  <LogIn className="w-4 h-4 mr-1" />Sign In
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 rounded-full"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border flex items-center justify-around h-14">
        {[...topNav.slice(0, 4), { icon: UserCircle, label: 'You', path: '/you' }].map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => feedback('tap', 8)}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors active:scale-95 ${
                isActive ? 'text-foreground' : 'text-foreground/70'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5] scale-110' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && <motion.span layoutId="mobNavIndicator" className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" transition={{ type:'spring', stiffness: 500, damping: 30 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Mobile slide-in menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-72 bg-card border-l border-border p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="font-extrabold text-lg">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search" className="pl-9 bg-secondary border-0 rounded-full h-10" />
            </div>
            <nav className="flex flex-col gap-1">
              {[...topNav, ...moreNav].map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-accent ${
                      isActive ? 'bg-accent text-foreground font-semibold' : 'text-foreground/80'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto">
              {user ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={avatarUrl || ''} />
                    <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{user.email?.split('@')[0]}</p>
                    <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground">Sign out</button>
                  </div>
                </div>
              ) : (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full rounded-full font-bold">
                    <LogIn className="w-4 h-4 mr-2" />Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
