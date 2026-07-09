import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Camera, FolderKanban, Search } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/scan', label: 'Scan Fatura', icon: Camera },
  { path: '/obras', label: 'Obras', icon: FolderKanban },
  { path: '/pesquisa', label: 'Preços', icon: Search },
];

export function Navigation() {
  return (
    <nav className="glass-panel" style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
      zIndex: 50,
      borderRadius: 'var(--radius-full)'
    }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.5rem 1rem',
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
              textDecoration: 'none',
              borderRadius: 'var(--radius-md)',
              transition: 'all 0.2s ease',
              backgroundColor: isActive ? 'var(--primary-light)' : 'transparent'
            })}
          >
            <Icon size={20} />
            <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
