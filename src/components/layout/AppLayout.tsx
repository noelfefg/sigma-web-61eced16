import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { House, Compass, MessageCircle, Plus, LogIn, UserCircle, Search, Menu, X, Radio, Settings, MessageSquareHeart, Users } from 'lucide-react';
import sigmaLogo from '@/assets/sigma-logo.jpeg';
import { Button } from '@/components/ui/button';
import { UserSearch } from '@/components/layout/UserSearch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

const mainNav = [
  { icon: House, label: 'Home', path: '/' },
  { icon: Compass, label: 'Discover', path: '/browse' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
];

const drawerNav = [
  { icon: Users, label: 'Sigmatized', path: '/following' },
  { icon: UserCircle, label: 'You', path: '/you' },
  { icon: Radio, label: 'Go Live', path: '/go-live' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: MessageSquareHeart, label: 'Feedback', path: '/feedback' },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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

  const isActive = (path: string) => location.pathname === path;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border/60 h-14 flex items-center px-3 md:px-5 gap-2">
          {/* Left: brand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <img src={sigmaLogo} alt="SIGMA" className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary/40 transition-all" />
              <span className="hidden sm:inline text-lg font-extrabold tracking-tight">SIGMA</span>
            </Link>
            <UserSearch className="hidden md:block w-64 ml-3" />
          </div>

          {/* Center: desktop nav */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-1">
            {mainNav.map((item) => (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    aria-label={item.label}
                    onClick={() => feedback('tap', 6)}
                    className={`group relative flex items-center justify-center h-11 w-24 rounded-xl transition-all active:scale-95 ${
                      isActive(item.path) ? 'text-primary bg-accent/50' : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                    }`}
                  >
                    <item.icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${isActive(item.path) ? 'stroke-[2.4]' : ''}`} />
                    {isActive(item.path) && (
                      <motion.span
                        layoutId="navIndicator"
                        className="absolute bottom-0 left-3 right-3 h-[3px] bg-primary rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent>{item.label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>

          {/* Right: actions */}
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 rounded-full"
              aria-label="Search"
              onClick={() => setMobileSearchOpen((o) => !o)}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Create — desktop only, bottom bar handles tablet/mobile */}
            <div className="hidden lg:block"><CreateMenu /></div>

            <ThemeToggle />

            {user ? (
              <>
                <NotificationBell onClick={() => { feedback('pop', 8); setNotifOpen((o) => !o); }} count={unreadCount} />
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
              className="lg:hidden h-9 w-9 rounded-full"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Mobile search drawer */}
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="md:hidden sticky top-14 z-30 bg-card/95 backdrop-blur-xl border-b border-border/60 px-3 py-2"
          >
            <UserSearch />
          </motion.div>
        )}

        <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

        {/* Main content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">{children}</main>

        {/* Tablet + mobile bottom navigation (TikTok style) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border/60 flex items-center justify-around h-16 px-2">
          {[mainNav[0], mainNav[1]].map((item) => (
            <BottomTab key={item.path} item={item} active={isActive(item.path)} onTap={() => feedback('tap', 8)} />
          ))}

          <button
            onClick={() => { feedback('pop', 10); navigate('/go-live'); }}
            aria-label="Create"
            className="relative -mt-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center transition-transform active:scale-90 hover:scale-105"
          >
            <Plus className="w-7 h-7" strokeWidth={2.5} />
          </button>

          <BottomTab item={mainNav[2]} active={isActive(mainNav[2].path)} onTap={() => feedback('tap', 8)} />
          <BottomTab
            item={{ icon: UserCircle, label: 'You', path: user ? '/you' : '/auth' }}
            active={isActive('/you')}
            onTap={() => feedback('tap', 8)}
          />
        </nav>

        {/* Slide-in menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              className="absolute top-0 right-0 h-full w-72 bg-card border-l border-border p-4 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-extrabold text-lg">Menu</span>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <UserSearch className="mb-4" />
              <nav className="flex flex-col gap-1">
                {[...mainNav, ...drawerNav].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-accent ${
                      isActive(item.path) ? 'bg-accent text-foreground font-semibold' : 'text-foreground/80'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="mt-auto">
                {user ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={avatarUrl || ''} />
                      <AvatarFallback><UserCircle className="w-5 h-5" /></AvatarFallback>
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
            </motion.div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function BottomTab({
  item,
  active,
  onTap,
}: {
  item: { icon: React.ElementType; label: string; path: string };
  active: boolean;
  onTap: () => void;
}) {
  return (
    <Link
      to={item.path}
      onClick={onTap}
      className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors active:scale-95 ${
        active ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      <item.icon className={`w-6 h-6 transition-transform ${active ? 'stroke-[2.5] scale-110' : ''}`} />
      <span className="text-[10px] font-medium">{item.label}</span>
      {active && (
        <motion.span
          layoutId="mobNavIndicator"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  );
}
