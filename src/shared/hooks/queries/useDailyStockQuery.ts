import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IS_CONFIGURED } from '@/config/axios';
import { fetchDailyStock, upsertDailyStock } from '@/shared/services/dailyStockService';
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
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (stock: Omit<DailyStock, 'id'>) => upsertDailyStock(stock),

    onMutate: async (stock) => {
      const key = DAILY_STOCK_KEY(stock.date);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<DailyStock | null>(key);
      qc.setQueryData<DailyStock | null>(key, old => ({
        id: old?.id ?? `temp-${Date.now()}`,
        ...stock,
      }));
      return { previous, date: stock.date };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx) qc.setQueryData(DAILY_STOCK_KEY(ctx.date), ctx.previous);
    },

    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: DAILY_STOCK_KEY(vars.date) });
    },
  });
}
