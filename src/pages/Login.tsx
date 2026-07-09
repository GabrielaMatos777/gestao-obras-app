import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { HardHat, Loader2 } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex-center animate-fade-in" style={{ minHeight: '100vh', padding: '1.5rem' }}>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', marginBottom: '1rem' }}>
            <HardHat size={48} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>Gestão de Obras</h1>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Área reservada a Gestores</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@empresa.pt"
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Palavra-passe</label>
            <input 
              type="password" 
              className="form-control" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ marginTop: '1rem', width: '100%', height: '56px', fontSize: '1.125rem' }}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} size={24} /> : 'Entrar'}
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
