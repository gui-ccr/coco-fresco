import { api } from '@/config/axios';
import type { Transaction } from '@/shared/types/transaction';

type TxRow = { id: string; cat: string; value: number; when: string; note: string | null; payment_method: string | null; is_fiado: boolean; no_caixa: boolean };

type NewTx = Omit<Transaction, 'id' | 'when'> & { when?: string };

function rowToTx(row: TxRow): Transaction {
  return {
    id:             row.id,
    cat:            row.cat            as Transaction['cat'],
    value:          Number(row.value),
    when:           row.when,
    note:           row.note           ?? undefined,
    payment_method: (row.payment_method as Transaction['payment_method']) ?? undefined,
    is_fiado:       row.is_fiado       ?? false,
    no_caixa:       row.no_caixa       ?? false,
  };
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data } = await api.get<TxRow[]>('/transactions', {
    params: { select: 'id,cat,value,when,note,payment_method,is_fiado,no_caixa', order: 'when.desc' },
  });
  return data.map(rowToTx);
}

export async function insertTransaction(tx: NewTx): Promise<Transaction> {
  const { data } = await api.post<TxRow[]>('/transactions', {
    cat:            tx.cat,
    value:          tx.value,
    when:           tx.when ?? new Date().toISOString(),
    note:           tx.note ?? null,
    payment_method: tx.payment_method ?? null,
    is_fiado:       tx.is_fiado ?? false,
    no_caixa:       tx.no_caixa ?? false,
  });
  return rowToTx(data[0]);
}

export async function updateTransaction(
  id: string,
  updates: Partial<Pick<Transaction, 'cat' | 'value' | 'when' | 'note' | 'payment_method' | 'is_fiado' | 'no_caixa'>>
): Promise<Transaction> {
  const { data } = await api.patch<TxRow[]>('/transactions', {
    ...(updates.cat            !== undefined && { cat:            updates.cat }),
    ...(updates.value          !== undefined && { value:          updates.value }),
    ...(updates.when           !== undefined && { when:           updates.when }),
    ...(updates.note           !== undefined && { note:           updates.note ?? null }),
    ...(updates.payment_method !== undefined && { payment_method: updates.payment_method ?? null }),
    ...(updates.is_fiado       !== undefined && { is_fiado:       updates.is_fiado }),
    ...(updates.no_caixa       !== undefined && { no_caixa:       updates.no_caixa }),
  }, { params: { id: `eq.${id}` } });
  return rowToTx(data[0]);
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.delete('/transactions', { params: { id: `eq.${id}` } });
}
