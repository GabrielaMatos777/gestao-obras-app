import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';

export function ForcePasswordChange() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('As palavras-passe não coincidem.');
      setLoading(false);
      return;
    }
    
    if (newPassword.length < 6) {
      setError('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      // 1. Update Auth user password
      const { data, error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) throw authError;

      // 2. Clear must_change_password flag
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ must_change_password: false })
          .eq('id', data.user.id);

        if (profileError) throw profileError;
        
        // Refresh the page to reload the profile and unlock the app
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar palavra-passe. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center animate-fade-in" style={{ minHeight: '100vh', padding: '1.5rem', backgroundColor: 'var(--bg-base)' }}>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 1.5rem', border: '1px solid var(--warning)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', borderRadius: '50%', marginBottom: '1rem' }}>
            <Lock size={48} />
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>Bem-vindo!</h1>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.875rem' }}>
            Por motivos de segurança, altere a palavra-passe temporária que lhe foi atribuída.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nova Palavra-passe</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control" 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Confirmar Nova Palavra-passe</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ paddingRight: '3rem' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ marginTop: '1rem', width: '100%', height: '56px', fontSize: '1.125rem', backgroundColor: 'var(--warning)', color: '#000' }}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'Guardar e Entrar'}
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
