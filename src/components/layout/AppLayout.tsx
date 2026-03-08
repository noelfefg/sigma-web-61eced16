import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Users, Menu, X, LogIn, User, Bell, Search, Gift, Video, ImageIcon, MessageSquare, UserCircle, Play, UsersRound, Mail, Camera, Paintbrush } from 'lucide-react';
import sigmaLogo from '@/assets/sigma-logo.jpeg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PopularStreamers } from '@/components/layout/PopularStreamers';
import { RecommendedCategories } from '@/components/layout/RecommendedCategories';
import { UserDropdownMenu } from '@/components/layout/UserDropdownMenu';
import { CreateMenu } from '@/components/layout/CreateMenu';
import { LiveBackground, useLiveBackground } from '@/components/layout/LiveBackground';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Compass, label: 'Browse', path: '/browse' },
  { icon: Users, label: 'Following', path: '/following' },
  { icon: ImageIcon, label: 'Feed', path: '/feed' },
  { icon: Play, label: 'Lil Vids', path: '/shorts' },
  { icon: UsersRound, label: 'Community', path: '/community' },
  { icon: Camera, label: 'Camera', path: '/camera' },
  { icon: Mail, label: 'Messages', path: '/messages' },
  { icon: Gift, label: 'Gifts', path: '/gifts' },
  { icon: Video, label: 'Go Live', path: '/go-live' },
  { icon: UserCircle, label: 'You', path: '/you' },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { bg, setBg, backgrounds } = useLiveBackground();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-card/80 backdrop-blur-xl transition-all duration-300 ${sidebarOpen ? 'w-56' : 'w-14'}`}>
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-3">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={sigmaLogo} alt="Sigma" className="w-8 h-8 rounded-lg object-cover" />
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground h-8 w-8">
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-1 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Categories */}
        {sidebarOpen && (
          <div className="px-2 py-2">
            <RecommendedCategories collapsed={!sidebarOpen} />
          </div>
        )}

        {/* Live Streamers */}
        <div className="px-2 py-2">
          <PopularStreamers collapsed={!sidebarOpen} />
        </div>

        {/* User */}
        <div className="p-3">
          {user ? (
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.email?.split('@')[0]}</p>
                  <button onClick={signOut} className="text-xs text-muted-foreground hover:text-primary transition-colors">Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="default" className={`w-full ${!sidebarOpen && 'px-0'}`}>
                <LogIn className="w-4 h-4" />
                {sidebarOpen && <span className="ml-2">Sign In</span>}
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-card/80 backdrop-blur-xl flex items-center justify-between px-4 sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-10 bg-secondary/60 rounded-lg h-9 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {user ? (
              <>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                  <Bell className="w-4 h-4" />
                </Button>
                <UserDropdownMenu user={user} signOut={signOut} />
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm">
                  <LogIn className="w-4 h-4 mr-1" />Sign In
                </Button>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-card/95 backdrop-blur-2xl z-50 transform transition-transform duration-300 md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-14 flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <img src={sigmaLogo} alt="Sigma" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-lg font-bold text-foreground">SIGMA</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="h-8 w-8">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{user.email?.split('@')[0]}</p>
                <button onClick={signOut} className="text-xs text-muted-foreground hover:text-primary transition-colors">Sign out</button>
              </div>
            </div>
          ) : (
            <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="default" className="w-full">
                <LogIn className="w-4 h-4 mr-2" />Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
