import { useState, useRef, useEffect } from 'react';
import { CheckCircle, AlertCircle, Save, Loader2, RefreshCw, Camera, ImageIcon, PenLine, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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

type AlocacaoExcecional = {
  obraId: string;
  percentagem: string; // Guardado como string para facilitar input
};

const MOTIVOS_MANUAL = [
  'Fatura Extraviada',
  'Documento Ilegível',
  'Fatura em Papel (não digitalizável)',
  'Compra Verbal / Sem Fatura',
  'Outro',
];

// Custom Autocomplete Component
function Autocomplete({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: string[], placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setFilter(value); }, [value]);

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
        onChange={(e) => { setFilter(e.target.value); onChange(e.target.value); setIsOpen(true); }}
        style={{ borderColor: filter ? 'var(--border-light)' : 'var(--warning)', minHeight: '48px' }}
      />
      {isOpen && filteredOptions.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
          background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)', maxHeight: '200px', overflowY: 'auto',
          listStyle: 'none', padding: 0, marginTop: '4px', boxShadow: 'var(--shadow-lg)'
        }}>
          {filteredOptions.map((opt) => (
            <li key={opt} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }}
              onClick={() => { onChange(opt); setFilter(opt); setIsOpen(false); }}>
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
  const [isManual, setIsManual] = useState(false);
  
  // UI States
  const [isAlocacaoExcecional, setIsAlocacaoExcecional] = useState(false);
  const [showOcrLines, setShowOcrLines] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isOnline, addToQueue } = useOfflineSync();
  const { session } = useAuth();

  const [obras, setObras] = useState<Obra[]>([]);
  const [knownProducts, setKnownProducts] = useState<string[]>([]);

  // Form State
  const [obraPrincipalId, setObraPrincipalId] = useState('');
  const [alocacoes, setAlocacoes] = useState<AlocacaoExcecional[]>([{ obraId: '', percentagem: '' }]);
  const [fornecedor, setFornecedor] = useState('');
  const [dataCompra, setDataCompra] = useState('');
  const [valorTotal, setValorTotal] = useState<number | ''>('');
  const [motivoManual, setMotivoManual] = useState('');
  const [items, setItems] = useState<ExtractedItem[]>([]);

  useEffect(() => {
    async function loadReferences() {
      const { data: obrasData } = await supabase.from('obras').select('*').eq('estado', 'ativa');
      if (obrasData) setObras(obrasData);
      const { data: matsData } = await supabase.from('materiais_comprados').select('produto_normalizado');
      if (matsData) setKnownProducts(Array.from(new Set(matsData.map((m: any) => m.produto_normalizado).filter(Boolean))));
    }
    loadReferences();
  }, []);

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setIsManual(false);
    if (selectedFile.type === 'application/pdf') {
      setPreview(null);
    } else {
      setPreview(URL.createObjectURL(selectedFile));
    }
    setIsScanning(true);
    setScanComplete(false);
    
    // PROMPT DO SISTEMA DE OCR (BACKEND):
    // "És um motor de OCR cego. A tua única função é a extração verbatim (cópia exata, letra a letra) do que está na imagem. NÃO normalizes nomes de produtos. NÃO inventes categorias. NÃO tentes corrigir a ortografia. Extrai as linhas de produtos e valores exatamente como estão impressos. Devolve a resposta em formato JSON puro."
    
    // TODO: Chamar API real de OCR aqui
    setTimeout(() => {
      setFornecedor('');
      setDataCompra('');
      setValorTotal('');
      setItems([]); // Sem mock data. Se a API falhar/não existir, a lista fica vazia.
      setIsScanning(false);
      setScanComplete(true);
      setShowOcrLines(true); // Exibir sempre o painel expansível/lista aberta
    }, 1500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  const handleManualEntry = () => {
    setIsManual(true);
    setFile(null);
    setPreview(null);
    setFornecedor('');
    setDataCompra(new Date().toISOString().split('T')[0]);
    setValorTotal('');
    setMotivoManual('');
    setItems([]);
    setIsScanning(false);
    setScanComplete(true);
    setShowOcrLines(true); // Se é manual, provavelmente quer inserir as linhas diretamente
  };

  const resetForm = () => {
    setFile(null); setPreview(null); setScanComplete(false);
    setIsManual(false); setItems([]); setIsAlocacaoExcecional(false);
    setObraPrincipalId(''); setAlocacoes([{ obraId: '', percentagem: '' }]);
    setFornecedor(''); setDataCompra(''); setValorTotal(''); setMotivoManual('');
    setShowOcrLines(false);
  };

  const addAlocacao = () => setAlocacoes(prev => [...prev, { obraId: '', percentagem: '' }]);
  const removeAlocacao = (idx: number) => setAlocacoes(prev => prev.filter((_, i) => i !== idx));
  const updateAlocacao = (idx: number, field: 'obraId' | 'percentagem', value: string) => {
    setAlocacoes(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };
  
  const addManualItem = () => {
    setItems(prev => [...prev, { id: Math.random().toString(), originalText: '', normalizedText: '', qty: 1, price: 0 }]);
  };
  const removeManualItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSave = async () => {
    if (!session?.user) return;
    
    const vTotal = Number(valorTotal);
    if (!vTotal || vTotal <= 0) { alert('Insira um valor total válido.'); return; }

    let alocacoesFinais: {obraId: string, valor: number}[] = [];

    if (isAlocacaoExcecional) {
      const validAloc = alocacoes.filter(a => a.obraId && a.percentagem);
      if (validAloc.length === 0) { alert('Selecione pelo menos uma Obra e percentagem.'); return; }
      
      const totalPercent = validAloc.reduce((sum, a) => sum + parseFloat(a.percentagem || '0'), 0);
      if (Math.abs(totalPercent - 100) > 0.1) { // margem pequena para decimais
        alert(`A soma das percentagens deve ser exatamente 100%. Atualmente é ${totalPercent}%.`);
        return;
      }
      alocacoesFinais = validAloc.map(a => ({
        obraId: a.obraId,
        valor: (parseFloat(a.percentagem) / 100) * vTotal
      }));
    } else {
      if (!obraPrincipalId) { alert('Selecione a Obra de destino.'); return; }
      alocacoesFinais = [{ obraId: obraPrincipalId, valor: vTotal }];
    }

    if (isManual && !motivoManual) { alert('Por favor, selecione um Motivo de Inserção Manual.'); return; }

    const unnormalized = items.find(i => !i.normalizedText.trim());
    if (unnormalized) { alert('Todos os produtos devem ter o nome normalizado.'); return; }

    setSaving(true);
    let foto_url = null;

    if (isOnline) {
      try {
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${session.user.id}/${fileName}`;
          const { error: uploadError } = await supabase.storage.from('faturas').upload(filePath, file);
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from('faturas').getPublicUrl(filePath);
          foto_url = data.publicUrl;
        }

        // Insert fatura (obra_id keeps the primary reference, even if split, just for simplicity in basic views)
        const { data: faturaData, error: faturaError } = await supabase
          .from('faturas')
          .insert({
            obra_id: alocacoesFinais[0].obraId, 
            fornecedor,
            data_compra: dataCompra,
            valor_total: vTotal,
            foto_url,
            motivo_manual: isManual ? motivoManual : null,
            registado_por: session.user.id
          })
          .select()
          .single();

        if (faturaError) throw faturaError;

        // Insert all allocations
        const alocacoesData = alocacoesFinais.map(a => ({
          fatura_id: faturaData.id,
          obra_id: a.obraId,
          valor_alocado: a.valor
        }));
        const { error: alocErr } = await supabase.from('fatura_alocacoes').insert(alocacoesData);
        if (alocErr) throw alocErr;

        // Insert materials (linked to fatura, not directly to single obra anymore to simplify)
        if (items.length > 0) {
          const materiaisToInsert = items.map(item => ({
            fatura_id: faturaData.id,
            obra_id: alocacoesFinais[0].obraId, // Retro-compatibilidade (idealmente a db devia perder o NOT NULL aqui tbm)
            texto_original_fatura: item.originalText || item.normalizedText,
            produto_normalizado: item.normalizedText,
            quantidade: item.qty,
            preco_unitario: item.price,
            preco_total_item: item.qty * item.price
          }));
          const { error: matsError } = await supabase.from('materiais_comprados').insert(materiaisToInsert);
          if (matsError) throw matsError;
        }

        alert('Fatura guardada com sucesso!');
        resetForm();

      } catch (err: any) {
        alert('Erro a guardar: ' + err.message);
      } finally {
        setSaving(false);
      }
    } else {
      addToQueue({ alocacoes: alocacoesFinais, fornecedor, dataCompra, valorTotal: vTotal, items });
      alert('Fatura guardada offline. Será sincronizada quando houver rede.');
      setSaving(false);
      resetForm();
    }
  };

  const showForm = scanComplete || (isManual && scanComplete);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <header className="page-header">
        <div>
          <h1 className="text-gradient">Nova Despesa</h1>
          <p>Scan ou inserção manual</p>
        </div>
      </header>

      {/* Upload Separados (Câmara vs Galeria) */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
      <input ref={fileInputRef} type="file" accept="image/*, application/pdf" style={{ display: 'none' }} onChange={handleFileChange} />

      {!showForm && !isScanning && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginTop: '2rem', maxWidth: '400px', margin: '2rem auto 0' }}>
          <button className="btn btn-primary glass-panel"
            style={{ width: '100%', height: '64px', fontSize: '1.125rem', justifyContent: 'center', gap: '1rem' }}
            onClick={() => cameraInputRef.current?.click()}>
            <Camera size={28} /> Tirar Foto
          </button>
          
          <button className="btn glass-panel"
            style={{ width: '100%', height: '64px', fontSize: '1.125rem', justifyContent: 'center', gap: '1rem', border: '1px solid var(--border-light)' }}
            onClick={() => fileInputRef.current?.click()}>
            <ImageIcon size={28} /> Escolher Ficheiro / Galeria
          </button>
          
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            A IA fará a leitura automática dos dados originais da fatura.
          </p>
          
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1rem', marginBottom: '1rem' }}>
            <hr style={{ flex: 1, borderColor: 'var(--border-light)' }} /> ou <hr style={{ flex: 1, borderColor: 'var(--border-light)' }} />
          </div>
          
          <button className="btn glass-panel"
            style={{ width: '100%', height: '64px', fontSize: '1.125rem', justifyContent: 'center', gap: '1rem', border: '1px solid var(--warning)', color: 'var(--warning)' }}
            onClick={handleManualEntry}>
            <PenLine size={24} /> Inserir Manualmente
          </button>
        </div>
      )}

      {isScanning && (
        <div className="flex-center" style={{ flexDirection: 'column', height: '40vh', gap: '1rem' }}>
          <Loader2 size={48} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          <h3>A analisar fatura...</h3>
        </div>
      )}

      {showForm && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* Preview panel (only for images) */}
          {preview && (
            <div className="card glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                Imagem
                <button className="btn-icon" onClick={resetForm} style={{ padding: '0.25rem' }} disabled={saving}><RefreshCw size={20} /></button>
              </h3>
              <div style={{ flex: 1, backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={preview} alt="Fatura" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
              </div>
            </div>
          )}

          {/* Form panel */}
          <div className="card glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <CheckCircle size={24} color="var(--success)" />
              <h3 style={{ margin: 0 }}>{isManual ? 'Inserção Manual' : 'Validar Dados'}</h3>
              {!preview && (
                <button className="btn-icon" onClick={resetForm} style={{ marginLeft: 'auto', padding: '0.25rem' }} disabled={saving}><RefreshCw size={20} /></button>
              )}
            </div>

            {/* Motivo Manual */}
            {isManual && (
              <div className="form-group">
                <label className="form-label">Motivo de Inserção Manual <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select className="form-control" value={motivoManual} onChange={e => setMotivoManual(e.target.value)} disabled={saving}
                  style={{ borderColor: motivoManual ? 'var(--border-light)' : 'var(--warning)' }}>
                  <option value="">Selecione o motivo...</option>
                  {MOTIVOS_MANUAL.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}

            {/* Header fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Total Fatura (€) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="number" step="0.01" className="form-control" style={{ fontSize: '1.25rem', fontWeight: 'bold' }} value={valorTotal} onChange={e => setValorTotal(e.target.value ? Number(e.target.value) : '')} disabled={saving} /></div>
              <div className="form-group"><label className="form-label">Fornecedor</label>
                <input type="text" className="form-control" value={fornecedor} onChange={e => setFornecedor(e.target.value)} disabled={saving} /></div>
              <div className="form-group"><label className="form-label">Data</label>
                <input type="date" className="form-control" value={dataCompra} onChange={e => setDataCompra(e.target.value)} disabled={saving} /></div>
            </div>
            
            <hr style={{ borderColor: 'var(--border-light)', margin: '1rem 0' }} />

            {/* Alocação Limpa */}
            <div style={{ marginBottom: '1rem' }}>
              {!isAlocacaoExcecional ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Obra de Destino <span style={{ color: 'var(--danger)' }}>*</span></span>
                    <button type="button" className="btn" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', textDecoration: 'underline' }} 
                            onClick={() => setIsAlocacaoExcecional(true)}>
                      Alocação Excecional
                    </button>
                  </label>
                  <select className="form-control" value={obraPrincipalId} onChange={e => setObraPrincipalId(e.target.value)} disabled={saving}>
                    <option value="">Selecione obra (100%)...</option>
                    {obras.map(o => <option key={o.id} value={o.id}>{o.nome_obra}</option>)}
                  </select>
                </div>
              ) : (
                <div style={{ backgroundColor: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Alocação Múltipla (%)</span>
                    <button type="button" className="btn" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', textDecoration: 'underline' }} 
                            onClick={() => { setIsAlocacaoExcecional(false); setAlocacoes([{ obraId: '', percentagem: '' }]); }}>
                      Cancelar divisão
                    </button>
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {alocacoes.map((aloc, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select className="form-control" value={aloc.obraId} onChange={e => updateAlocacao(idx, 'obraId', e.target.value)} disabled={saving} style={{ flex: 2 }}>
                          <option value="">Obra...</option>
                          {obras.map(o => <option key={o.id} value={o.id}>{o.nome_obra}</option>)}
                        </select>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input type="number" step="1" className="form-control" placeholder="%" value={aloc.percentagem}
                            onChange={e => updateAlocacao(idx, 'percentagem', e.target.value)} disabled={saving} />
                          <span style={{ position: 'absolute', right: '10px', top: '14px', color: 'var(--text-muted)' }}>%</span>
                        </div>
                        {alocacoes.length > 1 && (
                          <button type="button" className="btn-icon" onClick={() => removeAlocacao(idx)} disabled={saving} style={{ color: 'var(--danger)', flexShrink: 0 }}>
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn" style={{ fontSize: '0.875rem', padding: '0.5rem', marginTop: '0.5rem', width: '100%', justifyContent: 'center' }} onClick={addAlocacao}>
                    <Plus size={16} /> Adicionar Obra
                  </button>
                  
                  {alocacoes.length > 0 && (
                    <div style={{ 
                      marginTop: '1rem', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.875rem',
                      backgroundColor: alocacoes.reduce((s, a) => s + parseFloat(a.percentagem || '0'), 0) === 100 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: alocacoes.reduce((s, a) => s + parseFloat(a.percentagem || '0'), 0) === 100 ? 'var(--success)' : 'var(--danger)'
                     }}>
                      Soma: {alocacoes.reduce((s, a) => s + parseFloat(a.percentagem || '0'), 0)}% (deve ser 100%)
                    </div>
                  )}
                </div>
              )}
            </div>

            <hr style={{ borderColor: 'var(--border-light)', margin: '1.5rem 0' }} />

            {/* Acordeão de Items OCR totalmente editáveis */}
            <div>
              <button 
                type="button" 
                className="btn glass-panel" 
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-light)' }}
                onClick={() => setShowOcrLines(!showOcrLines)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} color="var(--warning)" />
                  <strong>Ver/Editar Linhas da Fatura</strong>
                </div>
                {showOcrLines ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {showOcrLines && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                  {items.map((item) => (
                    <div key={item.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-focus)', position: 'relative' }}>
                      <button className="btn-icon" style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: 'var(--danger)', padding: '0.25rem' }} onClick={() => removeManualItem(item.id)}>
                         <Trash2 size={16} />
                      </button>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Texto Extraído (Verbatim)</label>
                        <input type="text" className="form-control" value={item.originalText} onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, originalText: e.target.value } : i))} disabled={saving} placeholder="Ex: CIM. PORT. 25KG" style={{ fontSize: '0.875rem' }} />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label className="form-label">Nome Normalizado <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <Autocomplete value={item.normalizedText} onChange={(val) => setItems(items.map(i => i.id === item.id ? { ...i, normalizedText: val } : i))}
                          options={knownProducts} placeholder="Ex: Cimento 25kg" />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label className="form-label">Qtd</label>
                          <input type="number" className="form-control" value={item.qty} onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, qty: Number(e.target.value) } : i))} disabled={saving} />
                        </div>
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label className="form-label">Preço Unit. (€)</label>
                          <input type="number" step="0.01" className="form-control" value={item.price} onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, price: Number(e.target.value) } : i))} disabled={saving} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={addManualItem}>
                    <Plus size={18} /> Adicionar Linha Manulamente
                  </button>
                </div>
              )}
            </div>

            <button className="btn btn-primary" style={{ width: '100%', minHeight: '60px', fontSize: '1.125rem', marginTop: '2rem' }} onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={24} /> : <Save size={24} />}
              {saving ? 'A gravar...' : 'Gravar Fatura'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
