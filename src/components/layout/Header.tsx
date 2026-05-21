import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, User, Settings, ChevronDown, Sun, Moon, Sparkles } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import { markAllAsRead } from '@/store/slices/notificationsSlice';
import { logout } from '@/store/slices/authSlice';
import { toggleTheme } from '@/store/slices/uiSlice';
import { formatDateTime } from '@/lib/utils';
import { authService } from '@/services/auth.service';
import type { NotificationType } from '@/store/slices/notificationsSlice';

const notifDot: Record<NotificationType, string> = {
  success: '#10B981', error: '#EF4444', warning: '#F59E0B', info: '#06B6D4', rfid: '#6366F1',
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Bonjour', emoji: '☀️' };
  if (h < 18) return { text: 'Bon après-midi', emoji: '🌤️' };
  return { text: 'Bonsoir', emoji: '🌙' };
};

export const Header = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const { items, unreadCount } = useAppSelector((s) => s.notifications);
  const { currentPageTitle, theme } = useAppSelector((s) => s.ui);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const greeting = getGreeting();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    dispatch(logout());
    navigate('/login');
  };

  return (
    <>
      <header
        className="header-float"
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'relative',
          zIndex: 50,
        }}
      >
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>{currentPageTitle}</h1>
            {user && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{greeting.emoji} {greeting.text}, {user.firstName}</p>}
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" className="btn-icon" onClick={() => dispatch(toggleTheme())} title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Notifs */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button type="button" className="btn-icon relative" onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}>
              <Bell size={17} />
              {unreadCount > 0 && <span className="animate-pulse-ring" style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', border: '1.5px solid var(--header-bg)' }} />}
            </button>
            {showNotifs && (
              <div className="animate-scale-in" style={{ position: 'absolute', right: 0, top: 46, width: 380, borderRadius: 16, zIndex: 50, overflow: 'hidden', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(20px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Notifications</span>
                    {unreadCount > 0 && <span style={{ background: 'var(--accent-muted)', color: 'var(--accent)', borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>{unreadCount}</span>}
                  </div>
                  {unreadCount > 0 && <button onClick={() => dispatch(markAllAsRead())} style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none' }}>Tout lire</button>}
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {items.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Aucune notification</div>
                  ) : (
                    items.slice(0, 15).map((n) => (
                      <div key={n.id} style={{ display: 'flex', gap: 12, padding: '12px 16px', backgroundColor: !n.isRead ? 'var(--accent-muted)' : 'transparent', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: notifDot[n.type], flexShrink: 0, marginTop: 5 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{formatDateTime(n.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User */}
          <div style={{ position: 'relative' }} ref={userMenuRef}>
            <button
              type="button"
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
              className="user-menu-trigger"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px 6px 6px',
                borderRadius: 14,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                backdropFilter: 'blur(16px)',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
              }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div style={{ textAlign: 'left' }} className="hidden sm:block">
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>{user?.firstName} {user?.lastName}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' as const }}>{user?.role}</p>
              </div>
              <ChevronDown size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </button>
            {showUserMenu && (
              <div className="animate-scale-in" style={{ position: 'absolute', right: 0, top: 46, width: 188, borderRadius: 14, zIndex: 50, overflow: 'hidden', padding: '4px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                {[
                  { label: 'Mon profil', icon: User, action: () => { navigate('/profile'); setShowUserMenu(false); } },
                  { label: 'Configuration', icon: Settings, action: () => { navigate('/configuration'); setShowUserMenu(false); } },
                ].map(({ label, icon: Icon, action }) => (
                  <button key={label} type="button" className="dropdown-item" onClick={action}>
                    <Icon size={15} style={{ color: 'var(--text-muted)' }} />
                    {label}
                  </button>
                ))}
                <div style={{ margin: '4px 8px', borderTop: '1px solid var(--border-color)' }} />
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => { setShowLogoutConfirm(true); setShowUserMenu(false); }}
                  style={{ color: 'var(--danger)' }}
                >
                  <LogOut size={15} /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }} onClick={() => setShowLogoutConfirm(false)}>
          <div className="animate-scale-in" style={{ width: '100%', maxWidth: 360, margin: '0 16px', borderRadius: 20, padding: 28, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LogOut size={24} style={{ color: '#EF4444' }} />
              </div>
            </div>
            <h3 style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Se déconnecter ?</h3>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Vous serez redirigé vers la page de connexion.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>
                Annuler
              </button>
              <button type="button" className="btn-danger" style={{ flex: 1 }} onClick={handleLogout}>
                Déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
