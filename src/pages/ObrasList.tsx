import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, HardHat, ChevronRight, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Obra } from '../types/database';

export function ObrasList() {
  const navigate = useNavigate();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [nomeObra, setNomeObra] = useState('');
  const [cliente, setCliente] = useState('');
  const [morada, setMorada] = useState('');
  const [orcamento, setOrcamento] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadObras();
  }, []);

  async function loadObras() {
    setLoading(true);
    const { data, error } = await supabase.from('obras').select('*').order('created_at', { ascending: false });
    if (error) console.error('Erro ao carregar obras:', error);
    if (data) setObras(data);
    setLoading(false);
  }

  async function handleCreateObra(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error } = await supabase.from('obras').insert([{
      nome_obra: nomeObra.trim(),
      cliente: cliente.trim() || null,
      morada: morada.trim() || null,
      orcamento_total: orcamento ? parseFloat(orcamento) : null,
      estado: 'ativa',
      total_gasto: 0,
    }]);

    if (error) {
      console.error('Erro ao criar obra:', error);
      setError(`Erro: ${error.message}`);
      setSaving(false);
      return;
    }

    // Reset form & reload
    setNomeObra('');
    setCliente('');
    setMorada('');
    setOrcamento('');
    setShowModal(false);
    loadObras();
    setSaving(false);
  }

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="text-gradient">Obras</h1>
          <p>Controlo financeiro por centro de custo</p>
        </div>
        <button className="btn btn-primary" style={{ minHeight: '48px' }} onClick={() => { setShowModal(true); setError(null); }}>
          <Plus size={18} />
          Nova Obra
        </button>
      </header>

      {loading ? (
        <div className="flex-center" style={{ padding: '3rem' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : obras.length === 0 ? (
        <div className="card glass-panel flex-center" style={{ padding: '3rem', color: 'var(--text-muted)', flexDirection: 'column', gap: '1rem' }}>
          <HardHat size={48} color="var(--text-muted)" />
          <p>Nenhuma obra encontrada. Crie a sua primeira obra!</p>
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

      {/* Modal Nova Obra */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', zIndex: 100
        }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Nova Obra</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)} style={{ padding: '0.5rem' }}>
                <X size={24} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateObra} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nome da Obra *</label>
                <input type="text" className="form-control" required value={nomeObra}
                  onChange={e => setNomeObra(e.target.value)} placeholder="ex: Casa da Rita" />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cliente</label>
                <input type="text" className="form-control" value={cliente}
                  onChange={e => setCliente(e.target.value)} placeholder="Nome do cliente" />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Morada</label>
                <input type="text" className="form-control" value={morada}
                  onChange={e => setMorada(e.target.value)} placeholder="Rua, nº, cidade" />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Orçamento Total (€)</label>
                <input type="number" className="form-control" value={orcamento}
                  onChange={e => setOrcamento(e.target.value)} placeholder="0.00" min="0" step="0.01" />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  {saving ? 'A guardar...' : 'Criar Obra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
