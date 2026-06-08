import { api } from '@/config/axios';

export interface DailyStock {
  id: string;
  date: string;
  copos: number;
  g1l: number;
  g500: number;
  g300: number;
}

type DailyStockRow = {
  id: string;
  date: string;
  copos: number;
  g1l: number;
  g500: number;
  g300: number;
  created_at: string;
  updated_at: string;
};

function rowToStock(row: DailyStockRow): DailyStock {
  return {
    id:    row.id,
    date:  row.date,
    copos: row.copos,
    g1l:   row.g1l,
    g500:  row.g500,
    g300:  row.g300,
  };
}

export async function fetchDailyStock(date: string): Promise<DailyStock | null> {
  const { data } = await api.get<DailyStockRow[]>('/daily_stock', {
    params: { select: '*', date: `eq.${date}`, limit: 1 },
  });
  return data.length > 0 ? rowToStock(data[0]) : null;
}

export async function upsertDailyStock(
  stock: Omit<DailyStock, 'id'>
): Promise<DailyStock> {
  const { data } = await api.post<DailyStockRow[]>('/daily_stock', stock, {
    params: { on_conflict: 'date' },
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
  });
  return rowToStock(data[0]);
}
