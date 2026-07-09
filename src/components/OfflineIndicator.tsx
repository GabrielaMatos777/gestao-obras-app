import { WifiOff, CloudOff } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';

export function OfflineIndicator() {
  const { isOnline, pendingCount } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: isOnline ? 'var(--warning)' : 'var(--danger)',
      color: 'white',
      padding: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      zIndex: 1000,
      boxShadow: 'var(--shadow-md)'
    }}>
      {!isOnline ? (
        <>
          <WifiOff size={16} />
          Modo Offline Ativo
        </>
      ) : (
        <>
          <CloudOff size={16} />
          A Sincronizar ({pendingCount} pendente{pendingCount > 1 ? 's' : ''})...
        </>
      )}
    </div>
  );
}
