import { api } from '@/config/axios';
import type { AppSettings } from '@/shared/types/settings';

type SettingsRow = { preco_venda: AppSettings['precoVenda']; custo_unit: AppSettings['custoUnit'] };

export async function fetchSettings(): Promise<AppSettings | null> {
  const { data } = await api.get<SettingsRow[]>('/app_settings', {
    params: { select: 'preco_venda,custo_unit', id: 'eq.1' },
  });
  if (!data[0]) return null;
  return { precoVenda: data[0].preco_venda, custoUnit: data[0].custo_unit };
}

export async function upsertSettings(settings: AppSettings): Promise<void> {
  await api.patch('/app_settings', {
    preco_venda: settings.precoVenda,
    custo_unit:  settings.custoUnit,
  }, { params: { id: 'eq.1' } });
}
