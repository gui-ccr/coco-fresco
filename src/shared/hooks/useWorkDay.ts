import { useState, useEffect, useCallback } from 'react';
import type { WorkDay } from '@/shared/types/workDay';
import { todayDate } from '@/shared/lib/format';
import { fetchWorkDays, insertWorkDay } from '@/shared/services/workDayService';

const IS_CONFIGURED =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

interface UseWorkDayReturn {
  today: WorkDay | null;
  allDays: WorkDay[];
  needsInit: boolean;
  loading: boolean;
  initDay: (capitalInit: number) => Promise<void>;
}

export function useWorkDay(): UseWorkDayReturn {
  const [allDays, setAllDays] = useState<WorkDay[]>([]);
  const [loading, setLoading] = useState(true);
  const todayStr = todayDate();

  useEffect(() => {
    if (!IS_CONFIGURED) {
      setAllDays([]);
      setLoading(false);
      return;
    }

    fetchWorkDays()
      .then(remote => {
        setAllDays(remote.sort((a, b) => b.date.localeCompare(a.date)));
      })
      .catch(err => {
        console.error('Supabase workdays indisponível:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const today = allDays.find(d => d.date === todayStr) ?? null;
  const needsInit = !loading && today === null;

  const initDay = useCallback(async (capitalInit: number) => {
    if (!IS_CONFIGURED) {
      console.warn('Supabase não configurado');
      return;
    }

    try {
      const newDay = await insertWorkDay(todayStr, capitalInit);
      setAllDays(prev => [newDay, ...prev.filter(d => d.date !== todayStr)]);
    } catch (err) {
      console.error('Supabase insert falhou:', err);
      throw err;
    }
  }, [todayStr]);

  return { today, allDays, needsInit, loading, initDay };
}
