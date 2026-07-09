import { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, AlertCircle, Save, Loader2, RefreshCw } from 'lucide-react';
import { supabase, useAuth } from '../lib/supabase';
import { useOfflineSync } from '../hooks/useOfflineSync';
import type { Obra } from '../types/database';

type ExtractedItem = {
  id: string;
  originalText: string;
  normalizedText: string;
  qty: number;
  price: number;
};

// Custom Autocomplete Component
function Autocomplete({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: string[], placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFilter(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={filter}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setFilter(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        style={{ borderColor: filter ? 'var(--border-light)' : 'var(--warning)', minHeight: '48px' }}
      />
      {isOpen && filteredOptions.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 10,
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          maxHeight: '200px',
          overflowY: 'auto',
          listStyle: 'none',
          padding: 0,
          marginTop: '4px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {filteredOptions.map((opt) => (
            <li
              key={opt}
              style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }}
              onClick={() => {
                onChange(opt);
                setFilter(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ScanInvoice() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { isOnline, addToQueue } = useOfflineSync();
  const { session } = useAuth();

  // Reference Data
  const [obras, setObras] = useState<Obra[]>([]);
  const [knownProducts, setKnownProducts] = useState<string[]>([]);

  // Form State
  const [obraId, setObraId] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [dataCompra, setDataCompra] = useState('');
  const [valorTotal, setValorTotal] = useState(0);
  const [items, setItems] = useState<ExtractedItem[]>([]);

  useEffect(() => {
    async function loadReferences() {
      const { data: obrasData } = await supabase.from('obras').select('*').eq('estado', 'ativa');
      if (obrasData) setObras(obrasData);

      const { data: matsData } = await supabase.from('materiais_comprados').select('produto_normalizado');
      if (matsData) setKnownProducts(Array.from(new Set(matsData.map(m => m.produto_normalizado))));
    }
    loadReferences();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      
      setIsScanning(true);
      setScanComplete(false);
      
      // Simular OCR com IA
      setTimeout(() => {
        setFornecedor('Leroy Merlin (Lido por IA)');
        setDataCompra(new Date().toISOString().split('T')[0]);
        setValorTotal(145.50);
        setItems([
          { id: '1', originalText: 'CIMENTO PORTLAND 25KG', normalizedText: '', qty: 5, price: 6.50 },
          { id: '2', originalText: 'TINTA INT MAT PLAST 15L BR', normalizedText: '', qty: 1, price: 113.00 },
        ]);
        setIsScanning(false);
        setScanComplete(true);
      }, 2500);
    }
  };

  const handleItemNormalizationChange = (id: string, value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, normalizedText: value } : item));
  };

  const handleSave = async () => {
    if (!obraId || !session?.user) {
      alert("Por favor, selecione uma Obra.");
      return;
    }
    const unnormalized = items.find(i => !i.normalizedText.trim());
    if (unnormalized) {
      alert("Todos os produtos devem ser normalizados.");
      return;
    }
    
    setSaving(true);
    let foto_url = null;

    if (isOnline) {
      try {
        // 1. Upload File
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${session.user.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('faturas')
            .upload(filePath, file);

          if (uploadError) throw uploadError;
          
          const { data } = supabase.storage.from('faturas').getPublicUrl(filePath);
          foto_url = data.publicUrl;
        }

        // 2. Insert Header
        const { data: faturaData, error: faturaError } = await supabase
          .from('faturas')
          .insert({
            obra_id: obraId,
            fornecedor,
            data_compra: dataCompra,
            valor_total: valorTotal,
            foto_url,
            registado_por: session.user.id
          })
          .select()
          .single();

        if (faturaError) throw faturaError;

        // 3. Insert Items
        const materiaisToInsert = items.map(item => ({
          fatura_id: faturaData.id,
          texto_original_fatura: item.originalText,
          produto_normalizado: item.normalizedText,
          quantidade: item.qty,
          preco_unitario: item.price
        }));

        const { error: matsError } = await supabase.from('materiais_comprados').insert(materiaisToInsert);
        
        if (matsError) throw matsError;

        alert("Fatura guardada com sucesso!");

      } catch (err: any) {
        alert("Erro a guardar: " + err.message);
      } finally {
        setSaving(false);
      }
    } else {
      // Offline fallback
      addToQueue({ obraId, fornecedor, dataCompra, valorTotal, items });
      alert("Fatura guardada offline. Será sincronizada quando houver rede.");
      setSaving(false);
    }
    
    // Reset Form
    if (!saving) {
      setFile(null);
      setPreview(null);
      setScanComplete(false);
      setItems([]);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <header className="page-header">
        <div>
          <h1 className="text-gradient">Nova Despesa</h1>
          <p>Scan ou foto no local</p>
        </div>
      </header>

      {!preview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', marginTop: '2rem' }}>
          <label 
            className="btn btn-primary glass-panel" 
            style={{ 
              width: '200px', height: '200px', borderRadius: '50%', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 40px rgba(59, 130, 246, 0.4)', gap: '1rem', cursor: 'pointer'
            }}
          >
            <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileUpload} />
            <Camera size={64} />
            <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>Tirar Foto</span>
          </label>
          <p style={{ color: 'var(--text-secondary)' }}>A IA processará a imagem imediatamente.</p>
        </div>
      )}

      {preview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="card glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
             <h3 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
               Imagem Capturada
               <button className="btn-icon" onClick={() => setPreview(null)} style={{ padding: '0.25rem' }} disabled={saving}><RefreshCw size={20}/></button>
             </h3>
             <div style={{ flex: 1, backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <img src={preview} alt="Fatura" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
             </div>
          </div>

          <div className="card glass-panel">
            {isScanning ? (
              <div className="flex-center" style={{ flexDirection: 'column', height: '100%', gap: '1rem', minHeight: '300px' }}>
                <Loader2 size={48} color="var(--primary)" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                <h3>A analisar fatura...</h3>
              </div>
            ) : scanComplete ? (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--success)' }}>
                  <CheckCircle size={24} />
                  <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Validar Dados</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Obra <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <select className="form-control" value={obraId} onChange={(e) => setObraId(e.target.value)} disabled={saving}>
                      <option value="">Selecione...</option>
                      {obras.map(o => <option key={o.id} value={o.id}>{o.nome_obra}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Fornecedor</label><input type="text" className="form-control" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} disabled={saving} /></div>
                  <div className="form-group"><label className="form-label">Data</label><input type="date" className="form-control" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)} disabled={saving} /></div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Total (€)</label><input type="number" step="0.01" className="form-control" value={valorTotal} onChange={(e) => setValorTotal(Number(e.target.value))} disabled={saving} /></div>
                </div>

                <hr style={{ borderColor: 'var(--border-light)', margin: '2rem 0' }} />

                <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} color="var(--warning)" />
                  Normalização
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                  {items.map((item) => (
                    <div key={item.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-focus)' }}>
                      <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                        Texto Lido: <strong style={{ color: 'var(--text-secondary)' }}>{item.originalText}</strong>
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label className="form-label">Produto Normalizado <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <Autocomplete 
                          value={item.normalizedText} 
                          onChange={(val) => handleItemNormalizationChange(item.id, val)} 
                          options={knownProducts}
                          placeholder="Pesquise ou escreva o nome..."
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label className="form-label">Qtd</label>
                          <input type="number" className="form-control" value={item.qty} onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, qty: Number(e.target.value)} : i))} disabled={saving} />
                        </div>
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label className="form-label">Preço (€)</label>
                          <input type="number" step="0.01" className="form-control" value={item.price} onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, price: Number(e.target.value)} : i))} disabled={saving} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="btn btn-primary" style={{ width: '100%', minHeight: '60px', fontSize: '1.125rem' }} onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                  {saving ? 'A gravar...' : 'Gravar Fatura'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
