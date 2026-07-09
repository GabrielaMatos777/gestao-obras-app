import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { HardHat, Loader2, Eye, EyeOff } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Username visível → email fictício invisível
    const emailToAuth = `${username.toLowerCase().trim()}@obras.local`;

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToAuth,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
         setError('Nome de utilizador ou palavra-passe incorretos.');
      } else {
         setError(error.message);
      }
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
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex: gabrielamatos"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Palavra-passe</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingRight: '3rem' }}
              />
              <button 
                type="button"
                className="btn-icon"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', padding: '0.5rem', color: 'var(--text-muted)' }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
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
