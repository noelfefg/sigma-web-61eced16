import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, House, Menu, MessageCircle, Radio, Search, Settings, Users, UserCircle, BarChart3, MessageSquareHeart, LogIn, X } from 'lucide-react';
import sigmaLogo from '@/assets/sigma-logo.jpeg';
import { Button } from '@/components/ui/button';
import { UserSearch } from '@/components/layout/UserSearch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserDropdownMenu } from '@/components/layout/UserDropdownMenu';
import { NotificationPanel, NotificationBell } from '@/components/notifications/NotificationPanel';
import { useNotifications } from '@/hooks/useNotifications';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';

interface AppLayoutProps { children: ReactNode }

const tabs = [
  { icon: House, label: 'Home', path: '/' },
  { icon: Compass, label: 'Discover', path: '/browse' },
  { icon: Radio, label: 'Live', path: '/live' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
];

const explore = [
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Users, label: 'Sigmatized', path: '/following' },
];
const creator = [
  { icon: UserCircle, label: 'You', path: '/you' },
  { icon: Radio, label: 'Go Live', path: '/go-live' },
  { icon: BarChart3, label: 'Studio', path: '/studio' },
];
const account = [
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: MessageSquareHeart, label: 'Feedback', path: '/feedback' },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); setNotifOpen(false); }, [location.pathname]);

  const active = (path: string) => path === '/' ? location.pathname === '/' : location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isMoreActive = [...explore, ...creator, ...account].some((item) => active(item.path));
  const menuLink = (item: typeof explore[number]) => (
    <Link
      key={item.path}
      to={item.path}
      onClick={() => { feedback('tap'); setMenuOpen(false); }}
      aria-current={active(item.path) ? 'page' : undefined}
      className={cn('flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', active(item.path) ? 'bg-accent text-foreground' : 'text-muted-foreground')}
    >
      <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />{item.label}
    </Link>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-card/95 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
          <Link to="/" aria-label="Sigma home" className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <img src={sigmaLogo} alt="" className="h-9 w-9 rounded-full object-cover" />
            <span className="hidden text-lg font-bold sm:inline">SIGMA</span>
          </Link>
          <div className="mx-auto hidden w-full max-w-md md:block"><UserSearch /></div>
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:ml-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => { setSearchOpen((v) => !v); feedback('tap'); }} aria-label={searchOpen ? 'Close search' : 'Open search'} aria-expanded={searchOpen} className="md:hidden">
                  {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                </Button>
              </TooltipTrigger><TooltipContent>Search</TooltipContent>
            </Tooltip>
            <ThemeToggle />
            {user ? (
              <>
                <NotificationBell onClick={() => { feedback('pop'); setNotifOpen((v) => !v); }} count={unreadCount} />
                <UserDropdownMenu user={user} signOut={signOut} avatarUrl={avatarUrl} />
              </>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => navigate('/auth')}><LogIn className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Sign in</span></Button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => { setMenuOpen(true); feedback('tap'); }} aria-label="Open menu" aria-expanded={menuOpen}><Menu className="h-5 w-5" /></Button>
              </TooltipTrigger><TooltipContent>Menu</TooltipContent>
            </Tooltip>
          </div>
        </header>
        {searchOpen && <div className="sticky top-16 z-30 border-b border-border bg-card p-3 md:hidden"><UserSearch /></div>}
        <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
        <main className="min-w-0 flex-1 pb-24">{children}</main>
        <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-3xl items-stretch justify-between px-2 sm:px-6">
            {tabs.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => feedback('tap')} aria-current={active(item.path) ? 'page' : undefined}
                className={cn('relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', active(item.path) && 'text-foreground')}>
                {active(item.path) && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-primary" />}
                <item.icon aria-hidden="true" className="h-5 w-5" strokeWidth={active(item.path) ? 2.5 : 1.8} />
                <span className="text-[11px] font-medium sm:text-xs">{item.label}</span>
              </Link>
            ))}
            <Button type="button" variant="ghost" onClick={() => { setMenuOpen(true); feedback('tap'); }} aria-label="More destinations" aria-expanded={menuOpen}
              className={cn('relative flex h-full min-w-0 flex-1 flex-col gap-1 rounded-none px-0 text-muted-foreground hover:text-foreground', isMoreActive && 'text-foreground')}>
              {isMoreActive && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-primary" />}
              <Menu aria-hidden="true" className="h-5 w-5" /><span className="text-[11px] font-medium sm:text-xs">More</span>
            </Button>
          </div>
        </nav>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="right" className="flex w-[min(22rem,90vw)] flex-col border-border bg-card p-0">
            <SheetHeader className="border-b border-border px-5 py-5 text-left">
              <SheetTitle className="text-xl font-bold">Explore Sigma</SheetTitle>
              <SheetDescription>Everything in one place</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="mb-5"><p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">Explore</p>{explore.map(menuLink)}</div>
              <div className="mb-5"><p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">Create & manage</p>{creator.map(menuLink)}</div>
              <div><p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">Account</p>{account.map(menuLink)}</div>
            </div>
            <div className="border-t border-border p-4">
              {user ? <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9"><AvatarImage src={avatarUrl || ''} /><AvatarFallback><UserCircle className="h-5 w-5" /></AvatarFallback></Avatar>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{user.email}</span>
                <Button variant="ghost" size="sm" onClick={() => { setMenuOpen(false); signOut(); }}>Sign out</Button>
              </div> : <Button className="w-full" onClick={() => { setMenuOpen(false); navigate('/auth'); }}>Sign in</Button>}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
