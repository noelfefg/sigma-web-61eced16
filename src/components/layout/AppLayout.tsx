import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, User, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { LordIcon, ICONS } from '@/components/ui/LordIcon';
import sigmaLogo from '@/assets/sigma-logo.jpeg';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell, NotificationPanel } from '@/components/notifications/NotificationPanel';
import { useNotifications } from '@/hooks/useNotifications';
import { UserDropdownMenu } from '@/components/layout/UserDropdownMenu';
import { CreateMenu } from '@/components/layout/CreateMenu';
import { LiveBackground, useLiveBackground } from '@/components/layout/LiveBackground';
import { Masthead } from '@/components/layout/Masthead';
import { motion, AnimatePresence } from 'framer-motion';
import { LottieIcon } from '@/components/animations/LottieIcon';

interface AppLayoutProps { children: ReactNode; }

const navItems = [
  { lordIcon: ICONS.home,      label: 'Home',          path: '/' },
  { lordIcon: ICONS.compass,   label: 'Browse',        path: '/browse' },
  { lordIcon: ICONS.following, label: 'Following',     path: '/following' },
  { lordIcon: ICONS.image,     label: 'Sleek',         path: '/feed' },
  { lordIcon: ICONS.play,      label: 'Lil Vids',      path: '/shorts' },
  { lordIcon: ICONS.users,     label: 'Connectum',     path: '/community' },
  { lordIcon: ICONS.camera,    label: 'SigCam',        path: '/camera' },
  { lordIcon: ICONS.mail,      label: 'DM',            path: '/messages' },
  { lordIcon: ICONS.friends,   label: 'Friends',       path: '/friends' },
  { lordIcon: ICONS.gift,      label: 'Gifts',         path: '/gifts' },
  { lordIcon: ICONS.trophy,    label: 'Rankings',      path: '/rankings' },
  { lordIcon: ICONS.studio,    label: 'Creator Studio',path: '/studio' },
  { lordIcon: ICONS.feedback,  label: 'Feedback',      path: '/feedback' },
  { lordIcon: ICONS.video,     label: 'Go Live',       path: '/go-live' },
  { lordIcon: ICONS.shield,    label: 'Admin',         path: '/admin' },
  { lordIcon: ICONS.user,      label: 'You',           path: '/you' },
];

const mobileItems = [
  { lordIcon: ICONS.home,    label: 'Home',     path: '/' },
  { lordIcon: ICONS.compass, label: 'Browse',   path: '/browse' },
  { lordIcon: ICONS.play,    label: 'Lil Vids', path: '/shorts' },
  { lordIcon: ICONS.image,   label: 'Sleek',    path: '/feed' },
  { lordIcon: ICONS.user,    label: 'You',      path: '/you' },
];

type Streamer = { username: string; display_name: string; avatar_url: string | null; viewer_count: number; category: string; };

function fmt(n: number) { return n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n); }

function RecommendedStreamers({ collapsed }: { collapsed: boolean }) {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    supabase.from('streams')
      .select('viewer_count, profiles!inner(username,display_name,avatar_url), categories(name)')
      .eq('is_live', true).order('viewer_count', { ascending: false }).limit(10)
      .then(({ data }) => {
        if (data) setStreamers(data.map((s: any) => ({
          username: s.profiles.username, display_name: s.profiles.display_name,
          avatar_url: s.profiles.avatar_url, viewer_count: s.viewer_count,
          category: s.categories?.name || 'Live',
        })));
      });
  }, []);

  // Show section even with no streamers (collapsed sidebar shows avatars only)
  if (collapsed) {
    return (
      <div className="py-2 space-y-1 px-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {streamers.slice(0, 6).map(s => (
          <Link key={s.username} to={`/watch/${s.username}`} title={s.display_name}
            className="flex justify-center py-0.5">
            <div className="relative">
              <Avatar className="w-7 h-7 rounded-full">
                <AvatarImage src={s.avatar_url || ''} />
                <AvatarFallback style={{ background: '#222', fontSize: 9, color: '#1a56db', fontWeight: 800 }}>
                  {s.display_name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
                style={{ background: '#e91916', border: '1.5px solid #0f0f0f' }} />
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
      {/* Header row with toggle + close */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 group flex-1"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest transition-colors"
            style={{ color: open ? '#adadb8' : '#555' }}>
            Recommended
          </span>
          {streamers.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: '#e91916', color: '#fff' }}>
              {streamers.length} LIVE
            </span>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="ml-auto">
            <ChevronDown className="w-3 h-3" style={{ color: '#555' }} />
          </motion.div>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {streamers.length === 0 ? (
              <p className="px-3 pb-3 text-[11px]" style={{ color: '#444' }}>No one is live right now</p>
            ) : (
              <div className="pb-2 space-y-0.5 max-h-48 overflow-y-auto"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a2a2a transparent' }}>
                {streamers.map(s => (
                  <Link key={s.username} to={`/watch/${s.username}`}
                    className="flex items-center gap-2.5 px-3 py-1.5 mx-1 rounded-lg group hover:bg-white/[0.06] transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="w-[26px] h-[26px] rounded-full">
                        <AvatarImage src={s.avatar_url || ''} />
                        <AvatarFallback style={{ background: '#222', fontSize: 9, color: '#1a56db', fontWeight: 800 }}>
                          {s.display_name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
                        style={{ background: '#e91916', border: '1.5px solid #0f0f0f' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate group-hover:text-white transition-colors"
                        style={{ color: '#ccc' }}>{s.display_name}</p>
                      <p className="text-[10px] truncate flex items-center gap-1" style={{ color: '#555' }}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#e91916' }} />
                        {s.category}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold shrink-0 tabular-nums" style={{ color: '#555' }}>
                      {fmt(s.viewer_count)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { bg } = useLiveBackground();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
      .then(({ data }) => setAvatarUrl(data?.avatar_url || null));
  }, [user]);

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0a0a' }}>
      <LiveBackground variant={bg} />

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col sticky top-0 h-screen transition-all duration-200 shrink-0"
        style={{
          width: sidebarOpen ? 240 : 56,
          background: '#0f0f0f',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '0 16px 16px 0',
        }}
      >
        {/* Logo */}
        <div className="h-[52px] flex items-center px-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to="/" className={`flex items-center gap-2.5 flex-1 min-w-0 ${!sidebarOpen ? 'justify-center' : ''}`}>
            <img src={sigmaLogo} alt="Σ" className="w-7 h-7 object-cover shrink-0" style={{ borderRadius: 8 }} />
            {sidebarOpen && (
              <span className="font-black text-sm tracking-tight truncate" style={{ color: '#ffffff', letterSpacing: '-0.03em' }}>
                SIGMA
              </span>
            )}
          </Link>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-white/08 transition-colors" style={{ borderRadius: 8, color: '#666' }}>
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} className="p-2 mx-auto mt-2 hover:bg-white/08 transition-colors" style={{ borderRadius: 8, color: '#666' }}>
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-2 space-y-0.5">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} title={!sidebarOpen ? item.label : undefined}
                className="flex items-center gap-3 px-2.5 py-2 transition-all"
                style={{
                  borderRadius: 10,
                  background: active ? 'rgba(26,86,219,0.15)' : 'transparent',
                  color: active ? '#3b82f6' : '#888',
                  fontWeight: active ? 600 : 400,
                  fontSize: 13,
                  justifyContent: !sidebarOpen ? 'center' : undefined,
                }}
              >
                <LordIcon
                  icon={item.lordIcon}
                  size={22}
                  trigger="hover"
                  primary={active ? '3b82f6' : '666666'}
                  secondary={active ? 'ffffff' : '444444'}
                />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {item.path === '/go-live' && sidebarOpen && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Recommended streamers — expandable */}
        <RecommendedStreamers collapsed={!sidebarOpen} />

        {/* User */}
        <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {user ? (
            <div className={`flex items-center gap-2.5 ${!sidebarOpen ? 'justify-center' : ''}`}>
              <div className="relative shrink-0">
                <Avatar className="w-8 h-8 rounded-full">
                  <AvatarImage src={avatarUrl || ''} />
                  <AvatarFallback style={{ background: '#1a1a1a', color: '#1a56db', fontSize: 11, fontWeight: 800 }}>
                    <User className="w-3 h-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                  style={{ border: '2px solid #0f0f0f' }} />
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: '#e8e8e8' }}>{user.email?.split('@')[0]}</p>
                  <button onClick={signOut} className="text-[10px]" style={{ color: '#555' }}>Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth">
              <button className="flex items-center gap-2 text-xs font-semibold text-black px-3 py-2 transition-opacity hover:opacity-80"
                style={{ background: '#1a56db', borderRadius: 8, width: sidebarOpen ? '100%' : 36, height: sidebarOpen ? undefined : 36, justifyContent: 'center' }}>
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                {sidebarOpen && <span>Sign In</span>}
              </button>
            </Link>
          )}
        </div>
        {sidebarOpen && <Masthead />}
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-[52px] flex items-center gap-3 px-4 sticky top-0 z-30 shrink-0"
          style={{
            background: '#0f0f0f',
            
            
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <button className="md:hidden p-1.5 hover:bg-white/08 transition-colors" style={{ borderRadius: 8, color: '#888' }}
            onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="md:hidden flex items-center gap-1.5 shrink-0">
            <img src={sigmaLogo} alt="Σ" className="w-6 h-6 object-cover" style={{ borderRadius: 7 }} />
            <span className="font-black text-sm" style={{ color: '#ffffff' }}>SIGMA</span>
          </Link>

          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#444' }} />
            <input
              className="w-full h-9 pl-9 pr-3 text-sm text-white placeholder-[#444] outline-none focus:ring-1 focus:ring-[#1a56db]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
              placeholder="Search SIGMA..."
            />
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <ThemeToggle />
            <CreateMenu />
            {user ? (
              <>
                <NotificationBell onClick={() => setNotifOpen(v => !v)} count={unreadCount} />
                <UserDropdownMenu user={user} signOut={signOut} avatarUrl={avatarUrl} />
              </>
            ) : (
              <Link to="/auth">
                <button className="flex items-center gap-1.5 text-xs font-semibold text-black px-3 py-1.5 hover:opacity-80 transition-opacity"
                  style={{ background: '#1a56db', borderRadius: 8 }}>
                  <LogIn className="w-3.5 h-3.5" />Sign In
                </button>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
        <div className="hidden md:block"><Masthead /></div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex items-center h-14"
        style={{
          background: '#0f0f0f',
          
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {mobileItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors"
              style={{ color: active ? '#3b82f6' : '#555' }}>
              <LordIcon icon={item.lordIcon} size={22} trigger="hover"
                primary={active ? '1a56db' : '555555'} secondary={active ? 'ffffff' : '333333'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {mobileMenuOpen && <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />}
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Mobile drawer */}
      <div className={`fixed top-0 left-0 h-full w-64 z-50 md:hidden flex flex-col transition-transform duration-200 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: '#0f0f0f', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="h-[52px] flex items-center justify-between px-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <img src={sigmaLogo} alt="Σ" className="w-7 h-7 object-cover" style={{ borderRadius: 8 }} />
            <span className="font-black text-sm" style={{ color: '#ffffff' }}>SIGMA</span>
          </Link>
          <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 hover:bg-white/08 transition-colors" style={{ borderRadius: 8, color: '#888' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-1.5 py-2 space-y-0.5">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-2.5 py-2 transition-all"
                style={{
                  borderRadius: 10,
                  background: active ? 'rgba(26,86,219,0.15)' : 'transparent',
                  color: active ? '#3b82f6' : '#888',
                  fontWeight: active ? 600 : 400,
                  fontSize: 13,
                }}>
                <LordIcon icon={item.lordIcon} size={22} trigger="hover"
                  primary={active ? '3b82f6' : '666666'} secondary={active ? 'ffffff' : '444444'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <RecommendedStreamers collapsed={false} />
        <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {user ? (
            <div className="flex items-center gap-2.5">
              <Avatar className="w-8 h-8 rounded-full">
                <AvatarImage src={avatarUrl || ''} />
                <AvatarFallback style={{ background: '#1a1a1a', color: '#1a56db', fontSize: 11 }}>
                  <User className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: '#e8e8e8' }}>{user.email?.split('@')[0]}</p>
                <button onClick={signOut} className="text-[10px]" style={{ color: '#555' }}>Sign out</button>
              </div>
            </div>
          ) : (
            <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
              <button className="flex items-center gap-2 w-full justify-center text-xs font-semibold text-black px-3 py-2"
                style={{ background: '#1a56db', borderRadius: 8 }}>
                <LogIn className="w-3.5 h-3.5" />Sign In
              </button>
            </Link>
          )}
        </div>
        <Masthead />
      </div>
    </div>
  );
}
