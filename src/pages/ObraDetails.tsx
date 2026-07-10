import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Building2, Package, Loader2, Receipt, Pencil, Trash2, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Obra, Fatura, MaterialComprado } from '../types/database';

type EditFaturaState = {
  id: string;
  fornecedor: string;
  data_compra: string;
  valor_total: string;
};

export function ObraDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [obra, setObra] = useState<Obra | null>(null);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [materiais, setMateriais] = useState<MaterialComprado[]>([]);

  // Edit/Delete state
  const [editFatura, setEditFatura] = useState<EditFaturaState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadDetails(); }, [id]);

  async function loadDetails() {
    if (!id) return;
    setLoading(true);
    const [obraRes, faturasRes] = await Promise.all([
      supabase.from('obras').select('*').eq('id', id).single(),
      supabase.from('faturas').select('*').eq('obra_id', id).order('created_at', { ascending: false })
    ]);
    if (obraRes.data) setObra(obraRes.data);
    if (faturasRes.data && faturasRes.data.length > 0) {
      setFaturas(faturasRes.data);
      const faturaIds = faturasRes.data.map((f: Fatura) => f.id);
      const { data: mats } = await supabase.from('materiais_comprados').select('*').in('fatura_id', faturaIds);
      if (mats) setMateriais(mats);
    } else {
      setFaturas([]);
      setMateriais([]);
    }
    setLoading(false);
  }

  async function handleSaveEdit() {
    if (!editFatura) return;
    setSavingEdit(true);
    const { error } = await supabase.from('faturas').update({
      fornecedor: editFatura.fornecedor,
      data_compra: editFatura.data_compra,
      valor_total: parseFloat(editFatura.valor_total),
    }).eq('id', editFatura.id);
    setSavingEdit(false);
    if (error) { alert('Erro ao guardar: ' + error.message); return; }
    setEditFatura(null);
    loadDetails();
  }

  async function handleDelete() {
    if (!confirmDeleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('faturas').delete().eq('id', confirmDeleteId);
    setDeleting(false);
    if (error) { alert('Erro ao eliminar: ' + error.message); return; }
    setConfirmDeleteId(null);
    loadDetails();
  }

  if (loading) return <div className="flex-center" style={{ height: '60vh' }}><Loader2 className="animate-spin" size={48} color="var(--primary)" /></div>;
  if (!obra) return <div className="container" style={{ paddingTop: '2rem' }}>Obra não encontrada.</div>;

  const gastosPorFornecedor = faturas.reduce((acc, fatura) => {
    acc[fatura.fornecedor] = (acc[fatura.fornecedor] || 0) + Number(fatura.valor_total);
    return acc;
  }, {} as Record<string, number>);

  const gastosPorMaterial = materiais.reduce((acc, mat) => {
    acc[mat.produto_normalizado] = (acc[mat.produto_normalizado] || 0) + Number(mat.preco_total_item);
    return acc;
  }, {} as Record<string, number>);

  const fmt = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n);

  return (
    <div className="animate-fade-in">
      <header className="page-header" style={{ alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon" onClick={() => navigate('/obras')}><ArrowLeft size={24} /></button>
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
            {fmt(Number(obra.total_gasto) || 0)}
          </h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Gastos por Fornecedor */}
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Building2 size={20} color="var(--primary)" /> Gastos por Fornecedor
          </h3>
          <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead><tr><th>Fornecedor</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
              <tbody>
                {Object.entries(gastosPorFornecedor).sort((a, b) => b[1] - a[1]).map(([fornecedor, total]) => (
                  <tr key={fornecedor}><td style={{ fontWeight: 500 }}>{fornecedor}</td><td style={{ textAlign: 'right' }}>{fmt(total)}</td></tr>
                ))}
                {Object.keys(gastosPorFornecedor).length === 0 && (
                  <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sem registos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gastos por Material */}
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Package size={20} color="var(--warning)" /> Gastos por Material
          </h3>
          <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead><tr><th>Produto Normalizado</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
              <tbody>
                {Object.entries(gastosPorMaterial).sort((a, b) => b[1] - a[1]).map(([material, total]) => (
                  <tr key={material}><td style={{ fontWeight: 500 }}>{material}</td><td style={{ textAlign: 'right' }}>{fmt(total)}</td></tr>
                ))}
                {Object.keys(gastosPorMaterial).length === 0 && (
                  <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sem registos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lista de Faturas com Editar/Eliminar */}
        <div style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Receipt size={20} color="var(--success)" /> Faturas Registadas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {faturas.length === 0 && (
              <div className="card glass-panel" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                Nenhuma fatura registada nesta obra.
              </div>
            )}
            {faturas.map(fatura => (
              <div key={fatura.id} className="card glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{fatura.fornecedor || '—'}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{fatura.data_compra}</p>
                  {fatura.motivo_manual && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>✍️ {fatura.motivo_manual}</span>
                  )}
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{fmt(Number(fatura.valor_total))}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    onClick={() => setEditFatura({ id: fatura.id, fornecedor: fatura.fornecedor || '', data_compra: fatura.data_compra || '', valor_total: String(fatura.valor_total) })}>
                    <Pencil size={16} /> Editar
                  </button>
                  <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={() => setConfirmDeleteId(fatura.id)}>
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editFatura && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', zIndex: 100 }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Editar Fatura</h2>
              <button className="btn-icon" onClick={() => setEditFatura(null)}><X size={24} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fornecedor</label>
                <input type="text" className="form-control" value={editFatura.fornecedor}
                  onChange={e => setEditFatura({ ...editFatura, fornecedor: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Data</label>
                <input type="date" className="form-control" value={editFatura.data_compra}
                  onChange={e => setEditFatura({ ...editFatura, data_compra: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Valor Total (€)</label>
                <input type="number" step="0.01" className="form-control" value={editFatura.valor_total}
                  onChange={e => setEditFatura({ ...editFatura, valor_total: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button className="btn" style={{ flex: 1 }} onClick={() => setEditFatura(null)}>Cancelar</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveEdit} disabled={savingEdit}>
                  {savingEdit ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                  {savingEdit ? 'A guardar...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', zIndex: 100 }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
            <Trash2 size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
            <h3>Eliminar Fatura?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Esta ação é irreversível. A fatura e todos os materiais associados serão eliminados permanentemente.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setConfirmDeleteId(null)} disabled={deleting}>Cancelar</button>
              <button className="btn" style={{ flex: 1, backgroundColor: 'var(--danger)', color: 'white' }} onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={18} />}
                {deleting ? 'A eliminar...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
