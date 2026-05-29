import { useState, useCallback, useEffect } from 'react';
import { fetchSettings, upsertSettings } from '@/shared/services/settingsService';
import { type AppSettings, DEFAULT_SETTINGS } from '@/shared/types/settings';

export type { AppSettings };

const STORAGE_KEY = 'coco_settings_v1';

const IS_CONFIGURED =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

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

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadFromStorage);

  // On mount: sync from Supabase if configured
  useEffect(() => {
    if (!IS_CONFIGURED) return;

    fetchSettings()
      .then(remote => {
        if (remote) {
          setSettings(remote);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
        }
      })
      .catch(err => console.error('Erro ao buscar configurações:', err));
  }, []);

  const updateSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    if (IS_CONFIGURED) {
      upsertSettings(next).catch(err =>
        console.error('Erro ao salvar configurações:', err)
      );
    }
  }, []);

  return { settings, updateSettings };
}
