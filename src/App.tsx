import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { useAuth } from './lib/supabase';

// Pages
import { Dashboard } from './pages/Dashboard';
import { ScanInvoice } from './pages/ScanInvoice';
import { ObrasList } from './pages/ObrasList';
import { ObraDetails } from './pages/ObraDetails';
import { PriceSearch } from './pages/PriceSearch';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Login } from './pages/Login';
import { ForcePasswordChange } from './pages/ForcePasswordChange';
import { AdminUsers } from './pages/AdminUsers';
import { Loader2 } from 'lucide-react';

function App() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex-center" style={{ height: '100vh' }}><Loader2 className="animate-spin" size={48} color="var(--primary)" /></div>;
  }

  if (!session) {
    return <Login />;
  }

  if (profile?.must_change_password) {
    return <ForcePasswordChange />;
  }

  return (
    <BrowserRouter>
      <OfflineIndicator />
      <div className="container" style={{ paddingBottom: '6rem', paddingTop: '3rem' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scan" element={<ScanInvoice />} />
          <Route path="/obras" element={<ObrasList />} />
          <Route path="/obras/:id" element={<ObraDetails />} />
          <Route path="/pesquisa" element={<PriceSearch />} />
          {profile?.role === 'admin' && <Route path="/admin" element={<AdminUsers />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Navigation />
    </BrowserRouter>
  );
}

export default App;
