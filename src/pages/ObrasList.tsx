import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, HardHat, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Obra } from '../types/database';

export function ObrasList() {
  const navigate = useNavigate();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadObras() {
      setLoading(true);
      const { data } = await supabase.from('obras').select('*').order('created_at', { ascending: false });
      if (data) setObras(data);
      setLoading(false);
    }
    loadObras();
  }, []);

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="text-gradient">Obras</h1>
          <p>Controlo financeiro por centro de custo</p>
        </div>
        <button className="btn btn-primary" style={{ minHeight: '48px' }}>
          <Plus size={18} />
          Nova Obra
        </button>
      </header>

      {loading ? (
        <div className="flex-center" style={{ padding: '3rem' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : obras.length === 0 ? (
        <div className="card glass-panel flex-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
          Nenhuma obra encontrada. Crie a sua primeira obra!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {obras.map(obra => (
            <div 
              key={obra.id} 
              className="card glass-panel" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => navigate(`/obras/${obra.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-full)' }}>
                  <HardHat size={24} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{obra.nome_obra}</h3>
                  <span className={`badge ${obra.estado === 'ativa' ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: '0.25rem' }}>
                    {obra.estado.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Gasto</span>
                  <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                    {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(obra.total_gasto) || 0)}
                  </span>
                </div>
                <ChevronRight color="var(--text-secondary)" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
