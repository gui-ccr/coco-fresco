import { useCallback, useMemo } from 'react';
import { Package, Plus, Minus, TrendingDown, BarChart3 } from 'lucide-react';
import { useTransactionsQuery } from '@/shared/hooks/queries/useTransactionsQuery';
import { useSettingsQuery } from '@/shared/hooks/queries/useSettingsQuery';
import { useDailyStockQuery, useUpsertDailyStockMutation } from '@/shared/hooks/queries/useDailyStockQuery';
import { DEFAULT_SETTINGS } from '@/shared/types/settings';
import { todayDate, toLocalDate, formatFullDate } from '@/shared/lib/format';

type StockKey = 'copos' | 'g1l' | 'g500' | 'g300';

const CONTAINERS: {
  key: StockKey;
  label: string;
  sublabel: string;
  emoji: string;
  salecat: 'venda_copo' | 'venda_g1l' | 'venda_g500' | 'venda_g300';
  color: string;
  bg: string;
}[] = [
  {
    key: 'copos',
    label: 'Copos',
    sublabel: 'Copo plástico',
    emoji: '🥤',
    salecat: 'venda_copo',
    color: '#0891b2',
    bg: '#ecfeff',
  },
  {
    key: 'g1l',
    label: 'Garrafas 1L',
    sublabel: '1 litro',
    emoji: '🍾',
    salecat: 'venda_g1l',
    color: '#0369a1',
    bg: '#e0f2fe',
  },
  {
    key: 'g500',
    label: 'Garrafas 500ml',
    sublabel: '500 mililitros',
    emoji: '🧃',
    salecat: 'venda_g500',
    color: '#0e7490',
    bg: '#cffafe',
  },
  {
    key: 'g300',
    label: 'Garrafas 300ml',
    sublabel: '300 mililitros',
    emoji: '🫙',
    salecat: 'venda_g300',
    color: '#155e75',
    bg: '#a5f3fc',
  },
];

export function EstoqueView() {
  const today = todayDate();

  const { data: stockData, isLoading } = useDailyStockQuery(today);
  const { mutate: upsertStock } = useUpsertDailyStockMutation();

  const { data: transactions = [] } = useTransactionsQuery();
  const { data: settings = DEFAULT_SETTINGS } = useSettingsQuery();

  const stock = useMemo(
    () => ({
      copos: stockData?.copos ?? 0,
      g1l:   stockData?.g1l   ?? 0,
      g500:  stockData?.g500  ?? 0,
      g300:  stockData?.g300  ?? 0,
    }),
    [stockData]
  );

  const todayTxs = useMemo(
    () => transactions.filter(tx => toLocalDate(tx.when) === today),
    [transactions, today]
  );

  const soldQtys = useMemo(() => {
    const result: Record<StockKey, number> = { copos: 0, g1l: 0, g500: 0, g300: 0 };

    for (const tx of todayTxs) {
      if (tx.cat === 'venda_copo') {
        const price = settings.precoVenda.venda_copo;
        result.copos += price > 0 ? Math.round(tx.value / price) : 1;
      } else if (tx.cat === 'venda_g1l') {
        const price = settings.precoVenda.venda_g1l;
        result.g1l += price > 0 ? Math.round(tx.value / price) : 1;
      } else if (tx.cat === 'venda_g500') {
        const price = settings.precoVenda.venda_g500;
        result.g500 += price > 0 ? Math.round(tx.value / price) : 1;
      } else if (tx.cat === 'venda_g300') {
        const price = settings.precoVenda.venda_g300;
        result.g300 += price > 0 ? Math.round(tx.value / price) : 1;
      }
    }

    return result;
  }, [todayTxs, settings]);

  const adjust = useCallback((key: StockKey, delta: number) => {
    const next = {
      date:  today,
      copos: stock.copos,
      g1l:   stock.g1l,
      g500:  stock.g500,
      g300:  stock.g300,
      [key]: Math.max(0, stock[key] + delta),
    };
    upsertStock(next);
  }, [stock, today, upsertStock]);

  const formattedDate = formatFullDate(today);

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#f0f9ff' }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-6 flex-shrink-0"
        style={{ background: 'linear-gradient(160deg, #0c4a6e 0%, #0369a1 100%)' }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <Package size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Logística
            </p>
            <h1 className="text-xl font-black" style={{ color: '#fff' }}>Estoque</h1>
          </div>
        </div>
        <p className="text-xs mt-3 capitalize" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {formattedDate}
        </p>

        {/* Resumo rápido no header */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {CONTAINERS.map(c => {
            const sold = soldQtys[c.key];
            const init = stock[c.key];
            const remaining = init - sold;
            return (
              <div
                key={c.key}
                className="rounded-2xl px-2 py-2.5 text-center"
                style={{ background: 'rgba(255,255,255,0.12)' }}
              >
                <p className="text-lg leading-none">{c.emoji}</p>
                <p className="text-base font-black mt-1" style={{ color: remaining < 0 ? '#fca5a5' : '#fff' }}>
                  {remaining}
                </p>
                <p className="text-[8px] font-bold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  restam
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Estoque Inicial */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Package size={14} color="#0369a1" />
            <p className="text-[11px] font-black tracking-widest uppercase" style={{ color: '#0369a1' }}>
              Início do Dia
            </p>
            {isLoading && (
              <span className="text-[10px] ml-auto" style={{ color: '#94a3b8' }}>carregando...</span>
            )}
          </div>

          <div className="space-y-2.5">
            {CONTAINERS.map(c => (
              <div
                key={c.key}
                className="rounded-2xl px-4 py-3.5 flex items-center gap-4"
                style={{
                  background: '#fff',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: `1.5px solid ${c.color}22`,
                }}
              >
                {/* Ícone + label */}
                <div className="flex-shrink-0 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: c.bg }}
                  >
                    {c.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-black" style={{ color: '#0f172a' }}>{c.label}</p>
                    <p className="text-[10px]" style={{ color: '#94a3b8' }}>{c.sublabel}</p>
                  </div>
                </div>

                {/* Stepper */}
                <div className="ml-auto flex items-center gap-3">
                  <button
                    onClick={() => adjust(c.key, -1)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0' }}
                    disabled={stock[c.key] === 0 || isLoading}
                  >
                    <Minus size={16} color={stock[c.key] === 0 ? '#cbd5e1' : '#475569'} strokeWidth={2.5} />
                  </button>

                  <span
                    className="text-2xl font-black tabular-nums w-10 text-center"
                    style={{ color: c.color }}
                  >
                    {stock[c.key]}
                  </span>

                  <button
                    onClick={() => adjust(c.key, 1)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: c.color }}
                    disabled={isLoading}
                  >
                    <Plus size={16} color="#fff" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Vendas de Hoje */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={14} color="#059669" />
            <p className="text-[11px] font-black tracking-widest uppercase" style={{ color: '#059669' }}>
              Vendas de Hoje
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {CONTAINERS.map(c => {
              const sold = soldQtys[c.key];
              return (
                <div
                  key={c.key}
                  className="rounded-2xl px-4 py-3.5"
                  style={{
                    background: '#fff',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  }}
                >
                  <p className="text-lg">{c.emoji}</p>
                  <p className="text-2xl font-black mt-1 tabular-nums" style={{ color: sold > 0 ? '#059669' : '#94a3b8' }}>
                    {sold}
                  </p>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color: '#94a3b8' }}>
                    {c.label.toLowerCase()} vendidos
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Saldo Atual */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} color="#7c3aed" />
            <p className="text-[11px] font-black tracking-widest uppercase" style={{ color: '#7c3aed' }}>
              Saldo Atual
            </p>
          </div>

          <div className="space-y-2.5">
            {CONTAINERS.map(c => {
              const init = stock[c.key];
              const sold = soldQtys[c.key];
              const remaining = init - sold;
              const pct = init > 0 ? Math.min(100, Math.max(0, (sold / init) * 100)) : 0;
              const isNegative = remaining < 0;

              return (
                <div
                  key={c.key}
                  className="rounded-2xl px-4 py-3.5"
                  style={{
                    background: '#fff',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    border: isNegative ? '1.5px solid #fca5a5' : '1.5px solid transparent',
                  }}
                >
                  {/* Linha superior */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.emoji}</span>
                      <span className="text-sm font-bold" style={{ color: '#334155' }}>{c.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: '#94a3b8' }}>
                        {sold}/{init}
                      </span>
                      <span
                        className="text-sm font-black tabular-nums"
                        style={{ color: isNegative ? '#dc2626' : remaining === 0 && init > 0 ? '#059669' : c.color }}
                      >
                        {remaining >= 0 ? remaining : `−${Math.abs(remaining)}`}
                      </span>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div
                    className="w-full rounded-full overflow-hidden"
                    style={{ height: 6, background: '#f1f5f9' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? '#059669' : c.color,
                      }}
                    />
                  </div>

                  {/* Legendas */}
                  {init > 0 && (
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[9px]" style={{ color: '#94a3b8' }}>
                        vendidos: {Math.round(pct)}%
                      </span>
                      {isNegative && (
                        <span className="text-[9px] font-bold" style={{ color: '#dc2626' }}>
                          atenção: mais que o estoque!
                        </span>
                      )}
                      {!isNegative && remaining === 0 && init > 0 && (
                        <span className="text-[9px] font-bold" style={{ color: '#059669' }}>
                          tudo vendido! ✓
                        </span>
                      )}
                    </div>
                  )}

                  {init === 0 && (
                    <p className="text-[10px] mt-1" style={{ color: '#cbd5e1' }}>
                      defina o estoque inicial acima
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="h-4" />
      </div>
    </div>
  );
}
