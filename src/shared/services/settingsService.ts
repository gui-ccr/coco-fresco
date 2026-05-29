import { supabase } from '@/config/supabase';
import type { AppSettings } from '@/shared/hooks/useSettings';

export async function fetchSettings(): Promise<AppSettings | null> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('preco_venda, custo_unit')
    .eq('id', 1)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    precoVenda: data.preco_venda as AppSettings['precoVenda'],
    custoUnit:  data.custo_unit  as AppSettings['custoUnit'],
  };
}

export async function upsertSettings(settings: AppSettings): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .update({
      preco_venda: settings.precoVenda,
      custo_unit:  settings.custoUnit,
    })
    .eq('id', 1);

  if (error) throw error;
}
