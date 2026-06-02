import { api } from '@/config/axios';
import type { Transaction } from '@/shared/types/transaction';

type TxRow = { id: string; cat: string; value: number; when: string; note: string | null };

type NewTx = Omit<Transaction, 'id' | 'when'> & { when?: string };

function rowToTx(row: TxRow): Transaction {
  return {
    id:    row.id,
    cat:   row.cat   as Transaction['cat'],
    value: Number(row.value),
    when:  row.when,
    note:  row.note  ?? undefined,
  };
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data } = await api.get<TxRow[]>('/transactions', {
    params: { select: 'id,cat,value,when,note', order: 'when.desc' },
  });
  return data.map(rowToTx);
}

export async function insertTransaction(tx: NewTx): Promise<Transaction> {
  const { data } = await api.post<TxRow[]>('/transactions', {
    cat:   tx.cat,
    value: tx.value,
    when:  tx.when ?? new Date().toISOString(),
    note:  tx.note ?? null,
  });
  return rowToTx(data[0]);
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.delete('/transactions', { params: { id: `eq.${id}` } });
}
