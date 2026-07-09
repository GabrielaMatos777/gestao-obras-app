import { useState, useEffect, useCallback } from 'react';

type PendingInvoice = {
  id: string;
  data: any;
  timestamp: number;
};

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingQueue, setPendingQueue] = useState<PendingInvoice[]>([]);

  // Load from LocalStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('gestao-obras-pending');
    if (stored) {
      try {
        setPendingQueue(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing pending queue', e);
      }
    }

    const handleOnline = () => {
      setIsOnline(true);
      syncPendingQueue();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncPendingQueue = useCallback(() => {
    const stored = localStorage.getItem('gestao-obras-pending');
    if (stored) {
      const queue: PendingInvoice[] = JSON.parse(stored);
      if (queue.length > 0) {
        console.log(`Syncing ${queue.length} pending items...`);
        // Simulate sending to backend
        setTimeout(() => {
          localStorage.removeItem('gestao-obras-pending');
          setPendingQueue([]);
          alert(`${queue.length} faturas sincronizadas com sucesso!`);
        }, 1500);
      }
    }
  }, []);

  const addToQueue = (invoiceData: any) => {
    const newItem: PendingInvoice = {
      id: crypto.randomUUID(),
      data: invoiceData,
      timestamp: Date.now()
    };
    const newQueue = [...pendingQueue, newItem];
    setPendingQueue(newQueue);
    localStorage.setItem('gestao-obras-pending', JSON.stringify(newQueue));
  };

  return {
    isOnline,
    pendingCount: pendingQueue.length,
    addToQueue
  };
}
