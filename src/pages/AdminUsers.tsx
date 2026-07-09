import { useState, useEffect } from 'react';
import { ShieldAlert, UserPlus, Loader2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

export function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulário
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setMessage(null);

    try {
      // Endpoint criado no Vercel Functions para criar users de forma segura usando Service Role
      const response = await fetch('/api/createUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.toLowerCase().trim(),
          password,
          role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao criar o utilizador no servidor.');
      }

      setMessage({ type: 'success', text: `Utilizador @${username} criado com sucesso!` });
      setUsername('');
      setPassword('');
      setRole('user');
      
      // Atualizar a lista
      fetchProfiles();

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={28} />
            Gestão de Utilizadores
          </h1>
          <p>Área restrita a Administradores</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Painel de Criação */}
        <div className="card glass-panel" style={{ alignSelf: 'flex-start' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <UserPlus size={20} color="var(--primary)" />
            Criar Nova Conta
          </h3>

          {message && (
            <div style={{ 
              padding: '0.75rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem',
              backgroundColor: message.type === 'error' ? 'var(--danger-light)' : 'var(--success-light)',
              color: message.type === 'error' ? 'var(--danger)' : 'var(--success)'
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-control" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: manuel"
                autoCapitalize="none"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>* Não usar espaços ou caracteres especiais</span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password Temporária</label>
              <input 
                type="text" 
                className="form-control" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>* O utilizador será forçado a alterar esta password no 1º login.</span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nível de Acesso</label>
              <select className="form-control" value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'user')}>
                <option value="user">Utilizador Normal (Só regista obras e faturas)</option>
                <option value="admin">Administrador (Acesso total)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={isCreating}>
              {isCreating ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
              {isCreating ? 'A criar...' : 'Criar Conta'}
            </button>
          </form>
        </div>

        {/* Lista de Utilizadores Ativos */}
        <div className="card glass-panel">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Users size={20} />
            Utilizadores da Empresa
          </h3>

          {loading ? (
             <div className="flex-center" style={{ padding: '2rem' }}><Loader2 className="animate-spin" size={32} /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {profiles.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0' }}>@{p.username}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {p.must_change_password ? '🚨 Pendente mudar password' : '✅ Ativo'}
                    </span>
                  </div>
                  <span className={`badge ${p.role === 'admin' ? 'badge-warning' : 'badge-primary'}`}>
                    {p.role.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
