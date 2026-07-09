import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, FolderKanban, Search, TrendingUp, Receipt, HardHat, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [totalGasto, setTotalGasto] = useState(0);
  const [totalObrasAtivas, setTotalObrasAtivas] = useState(0);
  const [totalFaturas, setTotalFaturas] = useState(0);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      
      const { data: obras } = await supabase.from('obras').select('estado, total_gasto');
      const { count: faturasCount } = await supabase.from('faturas').select('*', { count: 'exact', head: true });

      if (obras) {
        setTotalGasto(obras.reduce((acc, obra) => acc + (Number(obra.total_gasto) || 0), 0));
        setTotalObrasAtivas(obras.filter(o => o.estado === 'ativa').length);
      }
      
      if (faturasCount !== null) {
        setTotalFaturas(faturasCount);
      }

      setLoading(false);
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return <div className="flex-center" style={{ height: '60vh' }}><Loader2 className="animate-spin" size={48} color="var(--primary)" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="text-gradient">Visão Geral</h1>
          <p>Resumo financeiro e controlo de obras</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="flex-between">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total de Compras</span>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalGasto)}</h2>
          <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>Atualizado ao minuto</span>
        </div>

        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="flex-between">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Obras Ativas</span>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', borderRadius: 'var(--radius-md)' }}>
              <HardHat size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>{totalObrasAtivas}</h2>
        </div>

        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="flex-between">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Faturas Registadas</span>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-md)' }}>
              <Receipt size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>{totalFaturas}</h2>
        </div>
      </div>

      <h2 style={{ marginBottom: '1rem' }}>Ações Rápidas</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <button 
          onClick={() => navigate('/scan')}
          className="card glass-panel" 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', cursor: 'pointer', border: '1px solid var(--primary)', minHeight: '48px' }}
        >
          <div style={{ padding: '1rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '50%' }}>
            <Camera size={28} />
          </div>
          <span style={{ fontWeight: 600 }}>Nova Despesa</span>
        </button>

        <button 
          onClick={() => navigate('/obras')}
          className="card glass-panel" 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', cursor: 'pointer', minHeight: '48px' }}
        >
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-primary)', borderRadius: '50%' }}>
            <FolderKanban size={28} />
          </div>
          <span style={{ fontWeight: 600 }}>Gerir Obras</span>
        </button>

        <button 
          onClick={() => navigate('/pesquisa')}
          className="card glass-panel" 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', cursor: 'pointer', minHeight: '48px' }}
        >
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-primary)', borderRadius: '50%' }}>
            <Search size={28} />
          </div>
          <span style={{ fontWeight: 600 }}>Pesquisa de Preços</span>
        </button>
      </div>
    </div>
  );
}
