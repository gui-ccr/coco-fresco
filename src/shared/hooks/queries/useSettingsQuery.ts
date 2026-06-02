import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IS_CONFIGURED } from '@/config/axios';
import { fetchSettings, upsertSettings } from '@/shared/services/settingsService';
import { type AppSettings, DEFAULT_SETTINGS } from '@/shared/types/settings';

export type { AppSettings };

const STORAGE_KEY = 'coco_settings_v1';

function loadFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<AppSettings>;
      return {
        precoVenda: { ...DEFAULT_SETTINGS.precoVenda, ...p.precoVenda },
        custoUnit:  { ...DEFAULT_SETTINGS.custoUnit,  ...p.custoUnit  },
      };
    }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

export const SETTINGS_KEY = ['settings'] as const;

export function useSettingsQuery() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn:  async () => {
      const remote = await fetchSettings();
      if (remote) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
        return remote;
      }
      return loadFromStorage();
    },
    enabled:              IS_CONFIGURED,
    initialData:          loadFromStorage,
    initialDataUpdatedAt: 0,
    staleTime:            1000 * 60 * 10, // 10 min
  });
}

export function useUpdateSettingsMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: upsertSettings,

    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: SETTINGS_KEY });
      const previous = qc.getQueryData<AppSettings>(SETTINGS_KEY);
      qc.setQueryData(SETTINGS_KEY, next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(SETTINGS_KEY, ctx.previous);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx.previous));
      }
    },

    onSettled: () => {
      if (IS_CONFIGURED) qc.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });
}
