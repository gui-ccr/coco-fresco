import { useState, useEffect, useCallback } from 'react';
import type { WorkDay } from '@/shared/types/transaction';
import { todayDate } from '@/shared/lib/format';
import { fetchWorkDays, insertWorkDay } from '@/shared/services/workDayService';

const STORAGE_KEY = 'coco_work_days_v1';

const IS_CONFIGURED =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

function loadFromStorage(): WorkDay[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WorkDay[]) : [];
  } catch { return []; }
}

function saveToStorage(days: WorkDay[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
}

function makeLocalDay(date: string, capitalInit: number): WorkDay {
  return { id: `wd_${Date.now()}`, date, capitalInit, createdAt: new Date().toISOString() };
}

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
      setAllDays(loadFromStorage());
      setLoading(false);
      return;
    }

    fetchWorkDays()
      .then(remote => {
        const local       = loadFromStorage();
        const remoteDates = new Set(remote.map(d => d.date));
        const localOnly   = local.filter(d => !remoteDates.has(d.date));
        const merged      = [...remote, ...localOnly].sort((a, b) => b.date.localeCompare(a.date));
        setAllDays(merged);
        saveToStorage(merged);
      })
      .catch(() => setAllDays(loadFromStorage()))
      .finally(() => setLoading(false));
  }, []);

  const today = allDays.find(d => d.date === todayStr) ?? null;
  const needsInit = !loading && today === null;

  const initDay = useCallback(async (capitalInit: number) => {
    let newDay: WorkDay;

    if (IS_CONFIGURED) {
      try {
        newDay = await insertWorkDay(todayStr, capitalInit);
      } catch {
        newDay = makeLocalDay(todayStr, capitalInit);
      }
    } else {
      newDay = makeLocalDay(todayStr, capitalInit);
    }

    setAllDays(prev => {
      const next = [newDay, ...prev.filter(d => d.date !== todayStr)];
      saveToStorage(next);
      return next;
    });
  }, [todayStr]);

  return { today, allDays, needsInit, loading, initDay };
}
