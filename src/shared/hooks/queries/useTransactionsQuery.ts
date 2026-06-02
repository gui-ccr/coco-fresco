import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IS_CONFIGURED } from '@/config/axios';
import { fetchTransactions, insertTransaction, deleteTransaction } from '@/shared/services/transactionService';
import type { Transaction } from '@/shared/types/transaction';

export const TX_KEY = ['transactions'] as const;

export function useTransactionsQuery() {
  return useQuery({
    queryKey: TX_KEY,
    queryFn:  fetchTransactions,
    enabled:  IS_CONFIGURED,
    initialData: (): Transaction[] => [],
  });
}

export function useAddTransactionMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: { tx: Omit<Transaction, 'id' | 'when'>; when?: string }) =>
      insertTransaction({ ...vars.tx, when: vars.when }),

    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: TX_KEY });
      const previous = qc.getQueryData<Transaction[]>(TX_KEY) ?? [];

      const optimistic: Transaction = {
        id:    `temp-${Date.now()}`,
        cat:   vars.tx.cat,
        value: vars.tx.value,
        when:  vars.when ?? new Date().toISOString(),
        note:  vars.tx.note,
      };

      qc.setQueryData<Transaction[]>(TX_KEY, old =>
        [optimistic, ...(old ?? [])].sort(
          (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()
        )
      );

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData(TX_KEY, ctx?.previous);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: TX_KEY });
    },
  });
}

export function useRemoveTransactionMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteTransaction,

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: TX_KEY });
      const previous = qc.getQueryData<Transaction[]>(TX_KEY) ?? [];
      qc.setQueryData<Transaction[]>(TX_KEY, old => (old ?? []).filter(t => t.id !== id));
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData(TX_KEY, ctx?.previous);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: TX_KEY });
    },
  });
}
