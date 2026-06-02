import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IS_CONFIGURED } from '@/config/axios';
import { fetchWorkDays, insertWorkDay } from '@/shared/services/workDayService';
import { todayDate } from '@/shared/lib/format';
import type { WorkDay } from '@/shared/types/workDay';

export const WORKDAY_KEY = ['workdays'] as const;

export function useWorkDayQuery() {
  const query = useQuery({
    queryKey: WORKDAY_KEY,
    queryFn:  fetchWorkDays,
    enabled:  IS_CONFIGURED,
    initialData: (): WorkDay[] => [],
  });

  const today     = query.data?.find(d => d.date === todayDate()) ?? null;
  const needsInit = !query.isFetching && IS_CONFIGURED && today === null;

  return { ...query, today, needsInit };
}

export function useInitDayMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ date, capitalInit }: { date: string; capitalInit: number }) =>
      insertWorkDay(date, capitalInit),

    onMutate: async ({ date, capitalInit }) => {
      await qc.cancelQueries({ queryKey: WORKDAY_KEY });
      const previous = qc.getQueryData<WorkDay[]>(WORKDAY_KEY) ?? [];

      const optimistic: WorkDay = {
        id:          `temp-${Date.now()}`,
        date,
        capitalInit,
        createdAt:   new Date().toISOString(),
      };

      qc.setQueryData<WorkDay[]>(WORKDAY_KEY, old => [optimistic, ...(old ?? [])]);
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData(WORKDAY_KEY, ctx?.previous);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: WORKDAY_KEY });
    },
  });
}
