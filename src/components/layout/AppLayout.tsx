import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Users, 
  Menu, 
  X, 
  LogIn,
  User,
  Bell,
  Search,
  Gift,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Compass, label: 'Browse', path: '/browse' },
  { icon: Users, label: 'Following', path: '/following' },
  { icon: Gift, label: 'Gifts', path: '/gifts' },
  { icon: Video, label: 'Go Live', path: '/go-live' },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col bg-card/80 backdrop-blur-xl border-r border-border/50 transition-all duration-300 ${
          sidebarOpen ? 'w-60' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/50">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow duration-300">
              <span className="text-primary-foreground font-bold text-sm">Σ</span>
            </div>
            {sidebarOpen && (
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">SIGMA</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground hover:bg-accent/50"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary/15 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]' : ''}`} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border/50">
          {user ? (
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
              <div className="w-9 h-9 bg-gradient-to-br from-primary/30 to-accent rounded-full flex items-center justify-center ring-2 ring-primary/20">
                <User className="w-4 h-4 text-primary" />
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.email?.split('@')[0]}
                  </p>
                  <button
                    onClick={signOut}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth">
              <Button 
                variant="default" 
                className={`w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 ${!sidebarOpen && 'px-0'}`}
              >
                <LogIn className="w-4 h-4" />
                {sidebarOpen && <span className="ml-2">Sign In</span>}
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-card/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 sticky top-0 z-30">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors duration-300 group-focus-within:text-primary" />
              <div className="absolute inset-0 rounded-full bg-primary/5 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500" />
              <Input
                placeholder="Search streams, channels..."
                className="pl-11 pr-4 bg-secondary/60 border-border/50 rounded-full h-10 backdrop-blur-sm shadow-sm transition-all duration-300 focus:shadow-md focus:shadow-primary/10 focus:border-primary/30 focus:bg-secondary/80 hover:bg-secondary/80 hover:border-border"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                </Button>
                <Link to={`/channel/${user.email?.split('@')[0]}`}>
                  <div className="w-9 h-9 bg-gradient-to-br from-primary/30 to-accent rounded-full flex items-center justify-center ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                </Link>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 rounded-full px-5">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-card/95 backdrop-blur-2xl border-r border-border/50 z-50 transform transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/50">
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-primary-foreground font-bold text-sm">Σ</span>
            </div>
            <span className="text-xl font-bold text-foreground">SIGMA</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/15 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary/30 to-accent rounded-full flex items-center justify-center ring-2 ring-primary/20">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{user.email?.split('@')[0]}</p>
                <button onClick={signOut} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="default" className="w-full bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20 rounded-xl">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
