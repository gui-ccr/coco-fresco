import { useState, useEffect, useCallback } from 'react';
import { type Transaction } from '@/shared/types/transaction';
import { fetchTransactions, insertTransaction, deleteTransaction } from '@/shared/services/transactionService';

const IS_CONFIGURED =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

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
      setTransactions([]);
      setLoading(false);
      return;
    }

    fetchTransactions()
      .then(remote => {
        setTransactions(remote.sort(
          (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()
        ));
        setError(null);
      })
      .catch(err => {
        console.error('Supabase transactions indisponível:', err);
        setError('Não foi possível carregar as transações.');
      })
      .finally(() => setLoading(false));
  }, []);

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'when'>) => {
    if (!IS_CONFIGURED) {
      console.warn('Supabase não configurado');
      return;
    }

    try {
      const saved = await insertTransaction(tx);
      setTransactions(prev => [saved, ...prev]);
    } catch (err) {
      console.error('Supabase insert falhou:', err);
      throw err;
    }
  }, []);

  const removeTransaction = useCallback(async (id: string) => {
    if (!IS_CONFIGURED) return;

    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Supabase delete falhou:', err);
      throw err;
    }
  }, []);

  return { transactions, loading, error, addTransaction, removeTransaction };
}
