import { supabase } from '@/config/supabase';
import type { Transaction } from '@/shared/types/transaction';

type NewTransaction = Omit<Transaction, 'id' | 'when'> & { when?: string };

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, cat, value, when, note')
    .order('when', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(row => ({
    id:    row.id,
    cat:   row.cat,
    value: Number(row.value),
    when:  row.when,
    note:  row.note ?? undefined,
  }));
}

export async function insertTransaction(tx: NewTransaction): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      cat:   tx.cat,
      value: tx.value,
      when:  tx.when ?? new Date().toISOString(),
      note:  tx.note ?? null,
    })
    .select('id, cat, value, when, note')
    .single();

  if (error) throw error;
  return {
    id:    data.id,
    cat:   data.cat,
    value: Number(data.value),
    when:  data.when,
    note:  data.note ?? undefined,
  };
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
