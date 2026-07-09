import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Fatura, MaterialComprado } from '../types/database';

export function PriceSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [fornecedorFilter, setFornecedorFilter] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [materiais, setMateriais] = useState<(MaterialComprado & { faturas: Fatura })[]>([]);
  const [allProdutos, setAllProdutos] = useState<string[]>([]);
  const [allFornecedores, setAllFornecedores] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      // Fetch materiais with their joined fatura
      const { data } = await supabase
        .from('materiais_comprados')
        .select('*, faturas(*)');
        
      if (data) {
        const joinedData = data as unknown as (MaterialComprado & { faturas: Fatura })[];
        setMateriais(joinedData);
        
        // Extract unique options for filters
        setAllProdutos(Array.from(new Set(joinedData.map(m => m.produto_normalizado))));
        setAllFornecedores(Array.from(new Set(joinedData.map(m => m.faturas.fornecedor))));
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredResults = useMemo(() => {
    let results = [...materiais];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      results = results.filter(r => r.produto_normalizado.toLowerCase().includes(lowerSearch));
    }

    if (fornecedorFilter) {
      results = results.filter(r => r.faturas.fornecedor === fornecedorFilter);
    }

    // Sort by Date descending
    results.sort((a, b) => new Date(b.faturas.data_compra).getTime() - new Date(a.faturas.data_compra).getTime());
    return results;
  }, [searchTerm, fornecedorFilter, materiais]);

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="text-gradient">Pesquisa de Preços</h1>
          <p>Histórico e evolução de preços de materiais</p>
        </div>
      </header>

      <div className="card glass-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Produto Normalizado</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ex: Tinta Branca 15L" 
                style={{ paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                list="produtos-list"
              />
              <datalist id="produtos-list">
                {allProdutos.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Filtrar Fornecedor</label>
            <div style={{ position: 'relative' }}>
              <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <select 
                className="form-control" 
                style={{ paddingLeft: '2.5rem', appearance: 'none' }}
                value={fornecedorFilter}
                onChange={(e) => setFornecedorFilter(e.target.value)}
              >
                <option value="">Todos os fornecedores</option>
                {allFornecedores.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

        </div>
      </div>

      <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th>Fornecedor</th>
                <th style={{ textAlign: 'right' }}>Preço Unitário</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((item) => (
                <tr key={item.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} color="var(--text-muted)" />
                    {new Date(item.faturas.data_compra).toLocaleDateString('pt-PT')}
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{item.produto_normalizado}</td>
                  <td>{item.faturas.fornecedor}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(item.preco_unitario))}
                  </td>
                </tr>
              ))}
              {filteredResults.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Nenhum resultado encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
