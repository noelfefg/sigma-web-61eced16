import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Users, Menu, X, LogIn, User, Bell, Search, ImageIcon, MessageSquare, UserCircle, Play, Mail, Settings } from 'lucide-react';
import sigmaLogo from '@/assets/sigma-logo.jpeg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserDropdownMenu } from '@/components/layout/UserDropdownMenu';
import { CreateMenu } from '@/components/layout/CreateMenu';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Compass, label: 'Browse', path: '/browse' },
  { icon: Users, label: 'Following', path: '/following' },
  { icon: ImageIcon, label: 'Feed', path: '/feed' },
  { icon: Play, label: 'Lil Vids', path: '/shorts' },
  { icon: Mail, label: 'Messages', path: '/messages' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: UserCircle, label: 'You', path: '/you' },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
      .then(({ data }) => setAvatarUrl(data?.avatar_url || null));
  }, [user]);

  return (
    <div className="min-h-screen bg-background flex relative">
      
      {/* Desktop Sidebar — X/Twitter style */}
      <aside className={`hidden md:flex flex-col bg-card border-r border-border transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-[72px]'}`}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={sigmaLogo} alt="Sigma" className="w-8 h-8 rounded-full object-cover" />
          </Link>
        </div>

        {/* Nav — bold X-style */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-5 px-4 py-3 rounded-full transition-all duration-200 group hover:bg-accent/60 ${
                  isActive ? 'text-foreground' : 'text-foreground/80 hover:text-foreground'
                }`}
              >
                <item.icon className={`flex-shrink-0 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} size={26} />
                {sidebarOpen && (
                  <span className={`text-xl tracking-tight ${isActive ? 'font-bold' : 'font-normal'}`}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Post Button — X style */}
        {sidebarOpen && (
          <div className="px-4 py-3">
            <CreateMenu />
          </div>
        )}

        {/* User */}
        <div className="p-4 mt-auto">
          {user ? (
            <div className={`flex items-center gap-3 p-3 rounded-full hover:bg-accent/50 transition-colors cursor-pointer ${!sidebarOpen && 'justify-center'}`}>
              <Avatar className="w-10 h-10">
                <AvatarImage src={avatarUrl || ''} />
                <AvatarFallback className="bg-secondary text-muted-foreground">
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-foreground truncate">{user.email?.split('@')[0]}</p>
                  <button onClick={signOut} className="text-sm text-muted-foreground hover:text-primary transition-colors">Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="default" className={`w-full rounded-full h-12 text-lg font-bold ${!sidebarOpen && 'px-0'}`}>
                <LogIn className="w-5 h-5" />
                {sidebarOpen && <span className="ml-2">Sign In</span>}
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-10 bg-secondary/60 rounded-full h-10 text-sm border-border" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div className="md:hidden"><CreateMenu /></div>
            {user ? (
              <>
                <Button variant="ghost" size="icon" className="text-foreground hover:text-foreground h-9 w-9">
                  <Bell className="w-5 h-5" />
                </Button>
                <UserDropdownMenu user={user} signOut={signOut} avatarUrl={avatarUrl} />
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="rounded-full font-bold">
                  <LogIn className="w-4 h-4 mr-1" />Sign In
                </Button>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border flex items-center justify-around h-14">
        {[
          { icon: Home, label: 'Home', path: '/' },
          { icon: Compass, label: 'Browse', path: '/browse' },
          { icon: Play, label: 'Lil Vids', path: '/shorts' },
          { icon: ImageIcon, label: 'Feed', path: '/feed' },
          { icon: UserCircle, label: 'You', path: '/you' },
        ].map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? 'text-foreground' : 'text-foreground/70'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu — X style */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-card border-r border-border z-50 transform transition-transform duration-300 md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-14 flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
            <img src={sigmaLogo} alt="Sigma" className="w-8 h-8 rounded-full object-cover" />
            <span className="text-xl font-extrabold text-foreground tracking-tight">SIGMA</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="h-9 w-9">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-5 px-4 py-3 rounded-full transition-all duration-200 hover:bg-accent/60 ${
                  isActive ? 'text-foreground' : 'text-foreground/80 hover:text-foreground'
                }`}
              >
                <item.icon className={`${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} size={24} />
                <span className={`text-lg tracking-tight ${isActive ? 'font-bold' : 'font-normal'}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {user ? (
            <div className="flex items-center gap-3 p-3 rounded-full hover:bg-accent/50 transition-colors">
              <Avatar className="w-10 h-10">
                <AvatarImage src={avatarUrl || ''} />
                <AvatarFallback className="bg-secondary text-muted-foreground">
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-foreground">{user.email?.split('@')[0]}</p>
                <button onClick={signOut} className="text-sm text-muted-foreground hover:text-primary transition-colors">Sign out</button>
              </div>
            </div>
          ) : (
            <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="default" className="w-full rounded-full h-12 text-lg font-bold">
                <LogIn className="w-5 h-5 mr-2" />Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}