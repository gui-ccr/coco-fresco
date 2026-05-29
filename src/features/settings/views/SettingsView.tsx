import { useState } from 'react';
import { Check, Settings } from 'lucide-react';
import { type AppSettings } from '@/shared/hooks/useSettings';
import { CATEGORY_META, QUICK_SALE_CATS, REPO_CATS } from '@/shared/types/transaction';
import { formatBRL } from '@/shared/lib/format';

interface Props {
  settings: AppSettings;
  updateSettings: (next: AppSettings) => void;
}

interface FieldConfig {
  key: string;
  label: string;
  emoji: string;
  description: string;
}

const VENDA_FIELDS: FieldConfig[] = QUICK_SALE_CATS.map(cat => ({
  key:         cat,
  label:       CATEGORY_META[cat].label,
  emoji:       CATEGORY_META[cat].emoji,
  description: 'Quanto você cobra do cliente',
}));

const REPO_FIELDS: FieldConfig[] = REPO_CATS.map(cat => ({
  key:         cat,
  label:       CATEGORY_META[cat].label,
  emoji:       CATEGORY_META[cat].emoji,
  description: 'Quanto custa cada unidade para você',
}));

function PriceField({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: number;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw]         = useState('');

  function startEdit() {
    setRaw(value > 0 ? value.toFixed(2).replace('.', ',') : '');
    setEditing(true);
  }

  function commitEdit() {
    const parsed = parseFloat(raw.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) onChange(parsed);
    setEditing(false);
  }

  return (
    <div
      className="flex items-center gap-3 py-3.5"
      style={{ borderBottom: '1px solid #f1f5f9' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: '#f8fafc' }}
      >
        {field.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{field.label}</p>
        <p className="text-[10px]" style={{ color: '#94a3b8' }}>{field.description}</p>
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: '#64748b' }}>R$</span>
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            value={raw}
            onChange={e => setRaw(e.target.value.replace(/[^0-9,]/g, ''))}
            onBlur={commitEdit}
            onKeyDown={e => e.key === 'Enter' && commitEdit()}
            className="w-20 text-right rounded-xl px-2 py-1.5 text-sm font-black outline-none"
            style={{
              background: '#f0fdf4',
              border: '2px solid #059669',
              color: '#059669',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={commitEdit}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: '#059669' }}
          >
            <Check size={14} className="text-white" />
          </button>
        </div>
      ) : (
        <button
          onClick={startEdit}
          className="rounded-xl px-3 py-1.5 text-sm font-black tabular-nums transition-colors active:scale-95"
          style={{
            background: value > 0 ? '#d1fae5' : '#fee2e2',
            color: value > 0 ? '#059669' : '#dc2626',
          }}
        >
          {value > 0 ? formatBRL(value) : 'Configurar'}
        </button>
      )}
    </div>
  );
}

export function SettingsView({ settings, updateSettings }: Props) {
  const [saved, setSaved] = useState(false);

  function handleVendaChange(key: string, value: number) {
    const next: AppSettings = {
      ...settings,
      precoVenda: { ...settings.precoVenda, [key]: value },
    };
    updateSettings(next);
    flashSaved();
  }

  function handleCustoChange(key: string, value: number) {
    const next: AppSettings = {
      ...settings,
      custoUnit: { ...settings.custoUnit, [key]: value },
    };
    updateSettings(next);
    flashSaved();
  }

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      {/* ─── Header ─── */}
      <div
        className="relative px-5 pt-14 pb-8"
        style={{
          background: 'linear-gradient(160deg, #312e81, #4f46e5)',
          borderRadius: '0 0 2rem 2rem',
        }}
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

        {/* Indicador "Salvo" */}
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

        {/* Seção: Preços de Venda */}
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

          <div>
            {VENDA_FIELDS.map(field => (
              <PriceField
                key={field.key}
                field={field}
                value={settings.precoVenda[field.key as keyof AppSettings['precoVenda']]}
                onChange={v => handleVendaChange(field.key, v)}
              />
            ))}
          </div>
        </div>

        {/* Seção: Custo de Reposição */}
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

          <div>
            {REPO_FIELDS.map(field => {
              const cost = settings.custoUnit[field.key as keyof AppSettings['custoUnit']];
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
        </div>

        {/* Info card */}
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
