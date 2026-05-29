import { useState, useEffect, useCallback } from 'react';
import { type Transaction } from '@/shared/types/transaction';
import { fetchTransactions, insertTransaction, deleteTransaction } from '@/shared/services/transactionService';

const STORAGE_KEY = 'coco_transactions_v1';

const IS_CONFIGURED =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

function loadFromStorage(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch { return []; }
}

function saveToStorage(txs: Transaction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
}

interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  addTransaction: (tx: Omit<Transaction, 'id' | 'when'>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
}

export function useTransactions(): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    if (!IS_CONFIGURED) {
      setTransactions(loadFromStorage());
      setLoading(false);
      return;
    }

    fetchTransactions()
      .then(remote => {
        // Preserva transações locais que ainda não foram sincronizadas com o Supabase
        const local     = loadFromStorage();
        const remoteIds = new Set(remote.map(t => t.id));
        const localOnly = local.filter(t => !remoteIds.has(t.id));
        const merged    = [...remote, ...localOnly].sort(
          (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()
        );
        setTransactions(merged);
        saveToStorage(merged);
        setError(null);
      })
      .catch(err => {
        console.warn('Supabase transactions indisponível, usando localStorage:', err);
        setTransactions(loadFromStorage());
      })
      .finally(() => setLoading(false));
  }, []);

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'when'>) => {
    let saved: Transaction;

    if (IS_CONFIGURED) {
      try {
        saved = await insertTransaction(tx);
      } catch (err) {
        console.warn('Supabase insert falhou, salvando localmente:', err);
        saved = {
          ...tx,
          id:   `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          when: new Date().toISOString(),
        };
      }
    } else {
      saved = {
        ...tx,
        id:   `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        when: new Date().toISOString(),
      };
    }

    setTransactions(prev => {
      const next = [saved, ...prev];
      saveToStorage(next);
      return next;
    });
  }, []);

  const removeTransaction = useCallback(async (id: string) => {
    if (IS_CONFIGURED) {
      try {
        await deleteTransaction(id);
      } catch (err) {
        console.warn('Supabase delete falhou:', err);
      }
    }
    setTransactions(prev => {
      const next = prev.filter(t => t.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  return { transactions, loading, error, addTransaction, removeTransaction };
}
