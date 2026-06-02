import { useState } from 'react';
import { Check, Settings } from 'lucide-react';
import { formatBRL } from '@/shared/lib/format';
import { PriceField } from './components/PriceField';
import { VENDA_FIELDS, REPO_FIELDS } from './constants/priceFields';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/shared/hooks/queries/useSettingsQuery';
import { DEFAULT_SETTINGS } from '@/shared/types/settings';

export function SettingsView() {
  const { data: settings = DEFAULT_SETTINGS } = useSettingsQuery();
  const updateMutation = useUpdateSettingsMutation();
  const [saved, setSaved] = useState(false);

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleVendaChange(key: string, value: number) {
    updateMutation.mutate({ ...settings, precoVenda: { ...settings.precoVenda, [key]: value } });
    flashSaved();
  }

  function handleCustoChange(key: string, value: number) {
    updateMutation.mutate({ ...settings, custoUnit: { ...settings.custoUnit, [key]: value } });
    flashSaved();
  }

  return (
    <div>
      {/* ─── Header ─── */}
      <div
        className="relative px-5 pt-14 pb-8"
        style={{ background: 'linear-gradient(160deg, #312e81, #4f46e5)', borderRadius: '0 0 2rem 2rem' }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
            borderRadius: '0 0 2rem 2rem',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <Settings size={20} className="text-indigo-300" />
            <p className="text-indigo-300 text-sm font-semibold">Configurações</p>
          </div>
          <h1 className="text-white text-2xl font-black">Ajustes de Preços</h1>
          <p className="text-indigo-300 text-sm mt-1">
            Configure os valores de venda e custo de reposição
          </p>
        </div>

        {saved && (
          <div
            className="absolute bottom-4 right-5 flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
          >
            <Check size={12} className="text-white" />
            <span className="text-white text-xs font-bold">Salvo!</span>
          </div>
        )}
      </div>

      {/* ─── Conteúdo ─── */}
      <div className="px-4 pt-5 space-y-4 pb-8">

        <div className="rounded-2xl p-5" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">💚</span>
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#059669' }}>
              Preços de Venda
            </p>
          </div>
          <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
            Quanto você cobra dos seus clientes por cada produto
          </p>
          {VENDA_FIELDS.map(field => (
            <PriceField
              key={field.key}
              field={field}
              value={settings.precoVenda[field.key as keyof typeof settings.precoVenda]}
              onChange={v => handleVendaChange(field.key, v)}
            />
          ))}
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🔶</span>
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#f97316' }}>
              Custo de Reposição
            </p>
          </div>
          <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
            Quanto custa cada unidade que você compra. Você informa a quantidade e o sistema calcula o total.
          </p>
          {REPO_FIELDS.map(field => {
            const cost = settings.custoUnit[field.key as keyof typeof settings.custoUnit];
            return (
              <PriceField
                key={field.key}
                field={{ ...field, description: cost > 0 ? `${formatBRL(cost)} por unidade` : 'Toque para configurar' }}
                value={cost}
                onChange={v => handleCustoChange(field.key, v)}
              />
            );
          })}
        </div>

        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
        >
          <span className="text-xl flex-shrink-0">💡</span>
          <p className="text-xs leading-relaxed" style={{ color: '#1e40af' }}>
            As alterações são salvas automaticamente e ficam disponíveis na próxima vez que abrir o app.
          </p>
        </div>
      </div>
    </div>
  );
}
