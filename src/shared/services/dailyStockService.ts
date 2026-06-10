import { api } from '@/config/axios';

export interface DailyStock {
  id: string;
  date: string;
  cocos_inicio: number;
  cocos_sobrou: number | null;
  copos: number;
  g1l: number;
  g500: number;
  g300: number;
  copos_gratis: number;
  g1l_gratis: number;
  g500_gratis: number;
  g300_gratis: number;
  copos_sobrou: number | null;
  g1l_sobrou: number | null;
  g500_sobrou: number | null;
  g300_sobrou: number | null;
}

type DailyStockRow = DailyStock & {
  created_at: string;
  updated_at: string;
};

function rowToStock(row: DailyStockRow): DailyStock {
  return {
    id:           row.id,
    date:         row.date,
    cocos_inicio: row.cocos_inicio ?? 0,
    cocos_sobrou: row.cocos_sobrou ?? null,
    copos:        row.copos,
    g1l:          row.g1l,
    g500:         row.g500,
    g300:         row.g300,
    copos_gratis: row.copos_gratis ?? 0,
    g1l_gratis:   row.g1l_gratis   ?? 0,
    g500_gratis:  row.g500_gratis  ?? 0,
    g300_gratis:  row.g300_gratis  ?? 0,
    copos_sobrou: row.copos_sobrou ?? null,
    g1l_sobrou:   row.g1l_sobrou   ?? null,
    g500_sobrou:  row.g500_sobrou  ?? null,
    g300_sobrou:  row.g300_sobrou  ?? null,
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
