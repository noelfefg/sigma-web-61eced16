import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Users, LogIn, Search, MessageSquare, UserCircle, Radio, Mail, Settings, MessageSquareHeart, Menu, X } from 'lucide-react';
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
  { icon: Compass, label: 'Streams', path: '/browse' },
  { icon: Users, label: 'Following', path: '/following' },
  { icon: Mail, label: 'Messages', path: '/messages' },
  { icon: UserCircle, label: 'You', path: '/you' },
];

const moreNav = [
  { icon: Radio, label: 'Go Live', path: '/go-live' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: MessageSquareHeart, label: 'Feedback', path: '/feedback' },
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
      {/* Facebook-style top navbar */}
      <header className="sticky top-0 z-40 bg-card border-b border-border h-14 flex items-center px-2 md:px-4 gap-2">
        {/* Left: Logo + search */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <img src={sigmaLogo} alt="SIGMA" className="w-9 h-9 rounded-full object-cover" />
            <span className="hidden sm:inline text-lg font-extrabold tracking-tight">SIGMA</span>
          </Link>
          <div className="hidden md:flex relative ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search SIGMA"
              className="pl-9 h-9 w-56 bg-secondary border-0 rounded-full text-sm"
            />
          </div>
        </div>

        {/* Center: Main nav */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
          {topNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-label={item.label}
                onClick={() => feedback('tap', 6)}
                className={`group relative flex items-center justify-center h-12 w-24 rounded-lg transition-all active:scale-95 ${
                  isActive ? 'text-foreground bg-accent/40' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <item.icon className={`w-6 h-6 transition-transform group-hover:scale-110 group-active:scale-90 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {isActive && (
                  <motion.span
                    layoutId="navIndicator"
                    className="absolute bottom-0 left-2 right-2 h-1 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="ml-auto flex items-center gap-1">
          <div className="hidden sm:block"><CreateMenu /></div>
          <ThemeToggle />
          {user ? (
            <>
              <Link to="/messages" className="hidden sm:block">
                <Button variant="ghost" size="icon" className="rounded-full bg-secondary hover:bg-accent h-9 w-9">
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </Link>
              <NotificationBell onClick={() => { feedback('pop', 8); setNotifOpen(o => !o); }} count={unreadCount} />
              <UserDropdownMenu user={user} signOut={signOut} avatarUrl={avatarUrl} />
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="rounded-full font-bold">
                <LogIn className="w-4 h-4 mr-1" />Sign In
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border flex items-center justify-around h-14">
        {topNav.map((item) => {
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
