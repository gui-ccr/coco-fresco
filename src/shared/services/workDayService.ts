import { supabase } from '@/config/supabase';
import type { WorkDay } from '@/shared/types/workDay';

function rowToWorkDay(row: { id: string; date: string; capital_init: number; created_at: string }): WorkDay {
  return {
    id:          row.id,
    date:        row.date,
    capitalInit: Number(row.capital_init),
    createdAt:   row.created_at,
  };
}

export async function fetchWorkDays(): Promise<WorkDay[]> {
  const { data, error } = await supabase
    .from('work_days')
    .select('id, date, capital_init, created_at')
    .order('date', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToWorkDay);
}

export async function insertWorkDay(date: string, capitalInit: number): Promise<WorkDay> {
  const { data, error } = await supabase
    .from('work_days')
    .insert({ date, capital_init: capitalInit })
    .select('id, date, capital_init, created_at')
    .single();

  if (error) throw error;
  return rowToWorkDay(data);
}
