const fs = require('fs');
const content = `import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, Building2, BookOpen,
  CalendarDays, Wifi, BarChart3, FileText, Settings, User,
  ChevronRight, Shield, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleSidebar } from '@/store/slices/uiSlice';

const NAV = [
  {
    section: 'PRINCIPAL',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    ],
  },
  {
    section: 'GESTION',
    items: [
      { to: '/students',  icon: Users,         label: 'Etudiants' },
      { to: '/teachers',  icon: GraduationCap, label: 'Enseignants' },
      { to: '/rooms',     icon: Building2,     label: 'Salles' },
      { to: '/courses',   icon: BookOpen,      label: 'Cours' },
      { to: '/schedule',  icon: CalendarDays,  label: 'Emploi du temps' },
    ],
  },
  {
    section: 'CONTROLE',
    items: [
      { to: '/rfid-access', icon: Wifi, label: 'Acces RFID' },
    ],
  },
  {
    section: 'ANALYSE',
    items: [
      { to: '/statistics', icon: BarChart3, label: 'Statistiques' },
      { to: '/reports',    icon: FileText,  label: 'Rapports' },
    ],
  },
  {
    section: 'SYSTEME',
    items: [
      { to: '/configuration', icon: Settings, label: 'Configuration' },
      { to: '/profile',       icon: User,     label: 'Mon profil' },
    ],
  },
];

export const Sidebar = () => {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const user = useAppSelector((s) => s.auth.user);

  const sidebarStyle = {
    backgroundColor: '#0F172A',
    borderColor: 'rgba(255,255,255,0.06)',
  };

  return (
    <aside
      className={\`relative flex flex-col h-screen transition-all duration-300 ease-in-out border-r flex-shrink-0 \${collapsed ? 'w-16' : 'w-64'}\`}
      style={sidebarStyle}
    >
      {/* Logo */}
      <div
        className={\`flex items-center h-16 px-4 flex-shrink-0 border-b \${collapsed ? 'justify-center' : 'gap-3'}\`}
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
        >
          <Shield size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight tracking-tight">UniAccess</p>
            <p className="text-xs leading-tight font-medium" style={{ color: '#818CF8' }}>Administration</p>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="absolute -right-3 top-[4.25rem] z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
        style={{ backgroundColor: '#6366F1', border: '2px solid #0F172A', color: '#fff' }}
      >
        {collapsed ? <PanelLeft size={10} /> : <PanelLeftClose size={10} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" style={{ scrollbarWidth: 'none' }}>
        {NAV.map(({ section, items }) => (
          <div key={section} className="mb-4">
            {!collapsed && (
              <p
                className="px-3 mb-1 text-[10px] font-semibold tracking-[0.12em] uppercase"
                style={{ color: '#475569' }}
              >
                {section}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={collapsed ? label : undefined}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 w-full"
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? 'rgba(99,102,241,0.14)' : 'transparent',
                    color: isActive ? '#A5B4FC' : '#64748B',
                    borderLeft: isActive && !collapsed ? '2px solid #6366F1' : '2px solid transparent',
                    justifyContent: collapsed ? 'center' : undefined,
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={17}
                        style={{ color: isActive ? '#818CF8' : '#64748B', flexShrink: 0 }}
                        className="group-hover:text-slate-400 transition-colors"
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate" style={{ color: isActive ? '#A5B4FC' : '#94A3B8' }}>
                            {label}
                          </span>
                          {isActive && <ChevronRight size={12} style={{ color: '#6366F1' }} />}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      {user && (
        <div
          className="flex-shrink-0 border-t p-3"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className={\`flex items-center \${collapsed ? 'justify-center' : 'gap-3'}\`}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] capitalize font-medium" style={{ color: '#818CF8' }}>
                  {user.role?.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
`;
fs.writeFileSync('C:/Users/HP/frontend-admin/src/components/layout/Sidebar.tsx', content);
console.log('Sidebar.tsx written OK');
