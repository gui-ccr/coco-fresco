import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IS_CONFIGURED } from '@/config/axios';
import { fetchDailyStock, upsertDailyStock } from '@/shared/services/dailyStockService';
import { todayDate } from '@/shared/lib/format';
import type { DailyStock } from '@/shared/services/dailyStockService';

export const DAILY_STOCK_KEY = (date: string) => ['daily_stock', date] as const;

export function useDailyStockQuery(date: string) {
  return useQuery({
    queryKey:             DAILY_STOCK_KEY(date),
    queryFn:              () => fetchDailyStock(date),
    enabled:              IS_CONFIGURED,
    initialData:          null,
    initialDataUpdatedAt: 0,
  });
}

export function useUpsertDailyStockMutation() {
  const qc   = useQueryClient();
  const date = todayDate();

  return useMutation({
    mutationFn: (stock: Omit<DailyStock, 'id'>) => upsertDailyStock(stock),

    onMutate: async (stock) => {
      const key = DAILY_STOCK_KEY(date);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<DailyStock | null>(key);

      qc.setQueryData<DailyStock | null>(key, old => ({
        id:   old?.id ?? `temp-${Date.now()}`,
        ...stock,
      }));

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData(DAILY_STOCK_KEY(date), ctx?.previous);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: DAILY_STOCK_KEY(date) });
    },
  });
}
