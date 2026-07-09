import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Building2, Package, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Obra, Fatura, MaterialComprado } from '../types/database';

export function ObraDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [obra, setObra] = useState<Obra | null>(null);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [materiais, setMateriais] = useState<MaterialComprado[]>([]);

  useEffect(() => {
    async function loadDetails() {
      if (!id) return;
      setLoading(true);

      const [obraRes, faturasRes] = await Promise.all([
        supabase.from('obras').select('*').eq('id', id).single(),
        supabase.from('faturas').select('*').eq('obra_id', id)
      ]);

      if (obraRes.data) setObra(obraRes.data);
      
      if (faturasRes.data && faturasRes.data.length > 0) {
        setFaturas(faturasRes.data);
        const faturaIds = faturasRes.data.map(f => f.id);
        const { data: mats } = await supabase.from('materiais_comprados').select('*').in('fatura_id', faturaIds);
        if (mats) setMateriais(mats);
      }
      
      setLoading(false);
    }
    loadDetails();
  }, [id]);

  if (loading) {
    return <div className="flex-center" style={{ height: '60vh' }}><Loader2 className="animate-spin" size={48} color="var(--primary)" /></div>;
  }

  if (!obra) return <div className="container" style={{ paddingTop: '2rem' }}>Obra não encontrada.</div>;

  const gastosPorFornecedor = faturas.reduce((acc, fatura) => {
    acc[fatura.fornecedor] = (acc[fatura.fornecedor] || 0) + Number(fatura.valor_total);
    return acc;
  }, {} as Record<string, number>);

  const gastosPorMaterial = materiais.reduce((acc, mat) => {
    acc[mat.produto_normalizado] = (acc[mat.produto_normalizado] || 0) + Number(mat.preco_total_item);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="animate-fade-in">
      <header className="page-header" style={{ alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon" onClick={() => navigate('/obras')}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ margin: 0 }}>{obra.nome_obra}</h1>
            <span className={`badge ${obra.estado === 'ativa' ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: '0.5rem' }}>
              {obra.estado.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <div className="card glass-panel" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-full)' }}>
          <TrendingUp size={32} color="var(--primary)" />
        </div>
        <div>
          <span style={{ color: 'var(--text-secondary)' }}>Total Investido</span>
          <h2 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--text-primary)' }}>
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(obra.total_gasto) || 0)}
          </h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Building2 size={20} color="var(--primary)" />
            Gastos por Fornecedor
          </h3>
          <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(gastosPorFornecedor).sort((a,b) => b[1] - a[1]).map(([fornecedor, total]) => (
                  <tr key={fornecedor}>
                    <td style={{ fontWeight: 500 }}>{fornecedor}</td>
                    <td style={{ textAlign: 'right' }}>{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(total)}</td>
                  </tr>
                ))}
                {Object.keys(gastosPorFornecedor).length === 0 && (
                  <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sem registos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Package size={20} color="var(--warning)" />
            Gastos por Material
          </h3>
          <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Produto Normalizado</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(gastosPorMaterial).sort((a,b) => b[1] - a[1]).map(([material, total]) => (
                  <tr key={material}>
                    <td style={{ fontWeight: 500 }}>{material}</td>
                    <td style={{ textAlign: 'right' }}>{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(total)}</td>
                  </tr>
                ))}
                 {Object.keys(gastosPorMaterial).length === 0 && (
                  <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sem registos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
