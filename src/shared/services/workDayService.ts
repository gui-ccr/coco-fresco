import { api } from '@/config/axios';
import type { WorkDay } from '@/shared/types/workDay';

type WorkDayRow = { id: string; date: string; capital_init: number; created_at: string };

function rowToWorkDay(row: WorkDayRow): WorkDay {
  return {
    id:          row.id,
    date:        row.date,
    capitalInit: Number(row.capital_init),
    createdAt:   row.created_at,
  };
}

export async function fetchWorkDays(): Promise<WorkDay[]> {
  const { data } = await api.get<WorkDayRow[]>('/work_days', {
    params: { select: 'id,date,capital_init,created_at', order: 'date.desc' },
  });
  return data.map(rowToWorkDay);
}

export async function insertWorkDay(date: string, capitalInit: number): Promise<WorkDay> {
  const { data } = await api.post<WorkDayRow[]>('/work_days', {
    date,
    capital_init: capitalInit,
  });
  return rowToWorkDay(data[0]);
}
