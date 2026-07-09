import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Camera, FolderKanban, Search, Users } from 'lucide-react';
import { useAuth } from '../lib/supabase';

export function Navigation() {
  const { profile } = useAuth();

  return (
    <nav style={{
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
    }} className="glass-panel">
      
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
        <LayoutDashboard size={24} />
      </NavLink>
      
      <NavLink to="/obras" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <FolderKanban size={24} />
      </NavLink>

      <NavLink to="/scan" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <div style={{
          backgroundColor: 'var(--primary)',
          color: 'white',
          padding: '0.75rem',
          borderRadius: '50%',
          marginTop: '-1.5rem',
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
        }}>
          <Camera size={28} />
        </div>
      </NavLink>

      <NavLink to="/pesquisa" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Search size={24} />
      </NavLink>

      {profile?.role === 'admin' && (
        <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={24} />
        </NavLink>
      )}

    </nav>
  );
}
