import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/store';
import { toggleSidebar } from '@/store/slices/uiSlice';
import {
  LayoutDashboard, Users, GraduationCap, DoorOpen,
  BookOpen, Calendar, Wifi, BarChart3, FileText,
  Settings, User, ChevronLeft, ChevronRight,
  FolderOpen, KeyRound, BookUser, CreditCard,
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';

const navItems = [
  { path: '/dashboard',          label: 'Tableau de bord',   icon: LayoutDashboard, group: 'main' },
  { path: '/students',           label: 'Étudiants',         icon: Users,           group: 'gestion' },
  { path: '/students/directory', label: 'Répertoire',        icon: BookUser,        group: 'gestion' },
  { path: '/teachers',           label: 'Enseignants',       icon: GraduationCap,   group: 'gestion' },
  { path: '/rooms',              label: 'Salles',            icon: DoorOpen,        group: 'gestion' },
  { path: '/courses',            label: 'Cours',             icon: BookOpen,        group: 'gestion' },
  { path: '/filieres',           label: 'Filières',          icon: FolderOpen,      group: 'gestion' },
  { path: '/schedule',           label: 'Emploi du temps',   icon: Calendar,        group: 'gestion' },
  { path: '/rfid-access',        label: 'Accès RFID',        icon: Wifi,            group: 'controle' },
  { path: '/rfid-assign',        label: 'Attribution RFID',  icon: CreditCard,      group: 'controle' },
  { path: '/temporary-codes',    label: 'Codes Temporaires', icon: KeyRound,        group: 'controle' },
  { path: '/statistics',         label: 'Statistiques',      icon: BarChart3,       group: 'analyse' },
  { path: '/reports',            label: 'Rapports',          icon: FileText,        group: 'analyse' },
  { path: '/configuration',      label: 'Configuration',     icon: Settings,        group: 'system' },
  { path: '/profile',            label: 'Mon profil',        icon: User,            group: 'system' },
];
const groupLabels: Record<string, string> = { gestion: 'Gestion', controle: 'Contrôle', analyse: 'Analyse', system: 'Système' };
const groupDots:  Record<string, string> = { gestion: '#818CF8', controle: '#06B6D4', analyse: '#10B981', system: '#FB923C' };

export const Sidebar = () => {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector((s) => s.ui);
  const { user } = useAppSelector((s) => s.auth);
  let lastGroup = '';

  return (
    <aside className={cn('sidebar-float')} style={{ width: sidebarCollapsed ? 68 : 240 }}>
      {/* Orbes bleu de nuit décoratifs */}
      <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', background:'rgba(99,102,241,0.12)', filter:'blur(60px)', top:-50, right:-50, pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'absolute', width:160, height:160, borderRadius:'50%', background:'rgba(6,182,212,0.07)', filter:'blur(50px)', bottom:80, left:-40, pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'absolute', width:120, height:120, borderRadius:'50%', background:'rgba(139,92,246,0.08)', filter:'blur(40px)', top:'40%', left:'25%', pointerEvents:'none', zIndex:0 }} />
      {/* Logo */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', flexShrink: 0, justifyContent: sidebarCollapsed ? 'center' : 'space-between', padding: sidebarCollapsed ? '0 8px' : '0 14px', borderBottom: '1px solid var(--sidebar-border)', position:'relative', zIndex:1 }}>
        {!sidebarCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Logo size={32} />
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--sidebar-title)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>UniAccess</p>
              <p style={{ fontSize: 9.5, color: 'var(--sidebar-text)', letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>Administration</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && <Logo size={32} />}
        {!sidebarCollapsed && (
          <button onClick={() => dispatch(toggleSidebar())} style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--sidebar-icon-btn-bg)', border: '1px solid var(--sidebar-icon-btn-border)', color: 'var(--sidebar-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <ChevronLeft size={14} />
          </button>
        )}
      </div>
      {sidebarCollapsed && (
        <button onClick={() => dispatch(toggleSidebar())} style={{ margin: '10px auto 2px', width: 36, height: 36, borderRadius: 10, background: 'var(--sidebar-icon-btn-bg)', border: '1px solid var(--sidebar-icon-btn-border)', color: 'var(--sidebar-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ChevronRight size={15} />
        </button>
      )}
      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', position:'relative', zIndex:1 }}>
        {navItems.map(({ path, label, icon: Icon, group }) => {
          const showGroupLabel = !sidebarCollapsed && group !== lastGroup && group !== 'main';
          const prevGroup = lastGroup;
          lastGroup = group;
          return (
            <div key={path}>
              {showGroupLabel && prevGroup !== '' && (
                <div style={{ padding: '14px 8px 5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: groupDots[group], opacity: 0.7 }} />
                    <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase' as const, color: 'var(--sidebar-section-text)', fontFamily: 'var(--font-body)' }}>{groupLabels[group]}</span>
                  </div>
                </div>
              )}
              <NavLink
                to={path}
                title={sidebarCollapsed ? label : undefined}
                data-onboarding={path === '/students' ? 'sidebar-students' : path === '/rfid-access' ? 'sidebar-rfid' : path === '/statistics' ? 'sidebar-stats' : path === '/configuration' ? 'sidebar-config' : undefined}
                style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: 9, padding: sidebarCollapsed ? '9px 0' : '8px 10px', justifyContent: (sidebarCollapsed ? 'center' : 'flex-start') as 'center' | 'flex-start', borderRadius: 10, marginBottom: 2, backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent', color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)', borderLeft: !sidebarCollapsed ? `2px solid ${isActive ? 'var(--sidebar-active-border)' : 'transparent'}` : 'none', textDecoration: 'none', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)', transition: 'all 0.16s ease' })}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} style={{ flexShrink: 0, opacity: 1 }} />
                    {!sidebarCollapsed && <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>{label}</span>}
                    {isActive && !sidebarCollapsed && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sidebar-active-border)', flexShrink: 0 }} />}
                  </>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>
      {/* User card */}
      {!sidebarCollapsed && user && (
        <div style={{ padding: '10px 12px 14px', borderTop: '1px solid var(--sidebar-border)', position:'relative', zIndex:1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--sidebar-user-card-bg)', borderRadius: 11, padding: '8px 10px', border: '1px solid var(--sidebar-user-card-border)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, boxShadow: '0 3px 10px rgba(99,102,241,0.3)', fontFamily: 'var(--font-display)' }}>
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--sidebar-user-name)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-display)' }}>{user.firstName} {user.lastName}</p>
              <p style={{ fontSize: 10.5, color: 'var(--sidebar-text)', textTransform: 'capitalize' as const }}>{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
