import { useCallback, useMemo, useState, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ArrowLeft, Package, Plus, Minus, TrendingDown, BarChart3, Gift, ClipboardCheck, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import { useTransactionsQuery } from '@/shared/hooks/queries/useTransactionsQuery';
import { useSettingsQuery } from '@/shared/hooks/queries/useSettingsQuery';
import { useDailyStockQuery, useUpsertDailyStockMutation } from '@/shared/hooks/queries/useDailyStockQuery';
import { DEFAULT_SETTINGS } from '@/shared/types/settings';
import { toLocalDate, formatFullDate } from '@/shared/lib/format';
import type { DailyStock } from '@/shared/services/dailyStockService';

interface Props {
  date:   string;
  onBack: () => void;
}

type StockKey = 'copos' | 'g1l' | 'g500' | 'g300';

const CONTAINERS: {
  key:     StockKey;
  label:   string;
  sublabel: string;
  emoji:   string;
  salecat: 'venda_copo' | 'venda_g1l' | 'venda_g500' | 'venda_g300';
  color:   string;
  bg:      string;
}[] = [
  { key: 'copos', label: 'Copos',          sublabel: 'Copo plástico',  emoji: '🥤', salecat: 'venda_copo',  color: '#0891b2', bg: '#ecfeff' },
  { key: 'g1l',   label: 'Garrafas 1L',    sublabel: '1 litro',        emoji: '🍾', salecat: 'venda_g1l',   color: '#0369a1', bg: '#e0f2fe' },
  { key: 'g500',  label: 'Garrafas 500ml', sublabel: '500 mililitros', emoji: '🧃', salecat: 'venda_g500',  color: '#0e7490', bg: '#cffafe' },
  { key: 'g300',  label: 'Garrafas 300ml', sublabel: '300 mililitros', emoji: '🫙', salecat: 'venda_g300',  color: '#155e75', bg: '#a5f3fc' },
];

// ── NumpadSheet ───────────────────────────────────────────────────────────────

interface NumpadTarget {
  type:     'init' | 'gratis' | 'sobrou';
  key:      StockKey;
  label:    string;
  emoji:    string;
  color:    string;
  current:  number | null;
  canClear: boolean;
}

interface NumpadSheetProps {
  target:    NumpadTarget;
  input:     string;
  onKey:     (k: string) => void;
  onConfirm: () => void;
  onClear:   () => void;
  onClose:   () => void;
}

function NumpadSheet({ target, input, onKey, onConfirm, onClear, onClose }: NumpadSheetProps) {
  const sheetRef    = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const sheet    = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!sheet || !backdrop) return;
    gsap.set(sheet,    { y: '100%' });
    gsap.set(backdrop, { opacity: 0 });
    gsap.to(sheet,    { y: '0%',    duration: 0.38, ease: 'expo.out' });
    gsap.to(backdrop, { opacity: 1, duration: 0.22, ease: 'power2.out' });
  }, []);

  const displayValue = input === '' ? '0' : input;
  const label =
    target.type === 'init'   ? 'Estoque inicial' :
    target.type === 'gratis' ? 'Dado de graça'   :
                               'Sobraram';

  return (
    <>
      <div
        ref={backdropRef}
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="fixed left-1/2 z-50 flex flex-col rounded-t-3xl overflow-hidden"
        style={{
          bottom: 40,
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: '448px',
          maxHeight: '88svh',
          background: '#ffffff',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.18)',
          willChange: 'transform',
        }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full" style={{ background: '#e2e8f0' }} />
        </div>

        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#94a3b8' }}>{label}</p>
            <p className="text-base font-black mt-0.5" style={{ color: '#0f172a' }}>
              {target.emoji} {target.label}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36, background: '#f1f5f9' }}
          >
            <X size={17} style={{ color: '#64748b' }} />
          </button>
        </div>

        <div
          className="mx-5 mb-3 rounded-2xl flex flex-col items-center justify-center py-5"
          style={{ background: target.type === 'gratis' ? 'linear-gradient(145deg,#faf5ff,#f3e8ff)' : 'linear-gradient(145deg,#f0f9ff,#e0f2fe)' }}
        >
          <p className="text-5xl font-black tabular-nums" style={{ color: target.color }}>
            {displayValue}
          </p>
          <p className="text-xs font-bold mt-1" style={{ color: target.color + '99' }}>
            {parseInt(displayValue) === 1 ? 'unidade' : 'unidades'}
          </p>
        </div>

        <div className="px-5 grid grid-cols-3 gap-2 mb-4 shrink-0">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => (
            key === '' ? <div key="spacer" /> : (
              <button
                key={`${key}-${i}`}
                onClick={() => onKey(key)}
                className="rounded-2xl text-lg font-bold active:scale-95 transition-all duration-75"
                style={{
                  height: '52px',
                  background: key === '⌫' ? '#fee2e2' : '#f8fafc',
                  color:      key === '⌫' ? '#dc2626' : '#0f172a',
                  border: '1.5px solid #e2e8f0',
                  fontFamily: 'inherit',
                }}
              >{key}</button>
            )
          ))}
        </div>

        <div className="px-5 pb-6 flex gap-3 shrink-0">
          {target.canClear ? (
            <button
              onClick={onClear}
              className="flex-1 h-14 rounded-2xl text-sm font-bold"
              style={{ background: '#f1f5f9', color: '#64748b', fontFamily: 'inherit' }}
            >Limpar</button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl text-sm font-bold"
              style={{ background: '#f1f5f9', color: '#64748b', fontFamily: 'inherit' }}
            >Cancelar</button>
          )}
          <button
            onClick={onConfirm}
            className="flex-2 h-14 rounded-2xl text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${target.color}dd, ${target.color})`,
              color: '#fff', fontFamily: 'inherit',
              boxShadow: `0 4px 16px ${target.color}44`,
            }}
          >
            <Check size={18} strokeWidth={3} />
            Confirmar
          </button>
        </div>
      </div>
    </>
  );
}

// ── StepperRow ────────────────────────────────────────────────────────────────

interface StepperRowProps {
  container:   typeof CONTAINERS[number];
  value:       number;
  isLoading:   boolean;
  onInc:       () => void;
  onDec:       () => void;
  onTapValue:  () => void;
  accentColor?: string;
}

function StepperRow({ container: c, value, isLoading, onInc, onDec, onTapValue, accentColor }: StepperRowProps) {
  const color = accentColor ?? c.color;
  return (
    <div
      className="rounded-2xl px-4 py-3.5 flex items-center gap-4"
      style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1.5px solid ${color}22` }}
    >
      <div className="flex-shrink-0 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: c.bg }}>
          {c.emoji}
        </div>
        <div>
          <p className="text-sm font-black" style={{ color: '#0f172a' }}>{c.label}</p>
          <p className="text-[10px]" style={{ color: '#94a3b8' }}>{c.sublabel}</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={onDec}
          className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
          style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0' }}
          disabled={value === 0 || isLoading}
        >
          <Minus size={16} color={value === 0 ? '#cbd5e1' : '#475569'} strokeWidth={2.5} />
        </button>

        <div
          onClick={onTapValue}
          className="flex items-center justify-center active:opacity-60 transition-opacity cursor-pointer flex-shrink-0"
          style={{ width: '2.5rem' }}
        >
          <span className="text-2xl font-black tabular-nums" style={{ color }}>{value}</span>
        </div>

        <button
          type="button"
          onClick={onInc}
          className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
          style={{ background: color }}
          disabled={isLoading}
        >
          <Plus size={16} color="#fff" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// ── EstoqueEditView ───────────────────────────────────────────────────────────

export function EstoqueEditView({ date, onBack }: Props) {
  const { data: stockData, isLoading } = useDailyStockQuery(date);
  const { mutate: upsertStock }        = useUpsertDailyStockMutation();

  const { data: transactions = [] }           = useTransactionsQuery();
  const { data: settings = DEFAULT_SETTINGS } = useSettingsQuery();

  const [showConciliacao, setShowConciliacao] = useState(false);
  const [numpadTarget, setNumpadTarget]       = useState<NumpadTarget | null>(null);
  const [numpadInput,  setNumpadInput]        = useState('');

  const stock = useMemo((): Omit<DailyStock, 'id'> => ({
    date,
    copos:        stockData?.copos        ?? 0,
    g1l:          stockData?.g1l          ?? 0,
    g500:         stockData?.g500         ?? 0,
    g300:         stockData?.g300         ?? 0,
    copos_gratis: stockData?.copos_gratis ?? 0,
    g1l_gratis:   stockData?.g1l_gratis   ?? 0,
    g500_gratis:  stockData?.g500_gratis  ?? 0,
    g300_gratis:  stockData?.g300_gratis  ?? 0,
    copos_sobrou: stockData?.copos_sobrou ?? null,
    g1l_sobrou:   stockData?.g1l_sobrou   ?? null,
    g500_sobrou:  stockData?.g500_sobrou  ?? null,
    g300_sobrou:  stockData?.g300_sobrou  ?? null,
    cocos_inicio: stockData?.cocos_inicio ?? 0,
    cocos_sobrou: stockData?.cocos_sobrou ?? null,
  }), [stockData, date]);

  const dayTxs = useMemo(
    () => transactions.filter(tx => toLocalDate(tx.when) === date),
    [transactions, date]
  );

  const soldQtys = useMemo(() => {
    const r: Record<StockKey, number> = { copos: 0, g1l: 0, g500: 0, g300: 0 };
    for (const tx of dayTxs) {
      if (tx.cat === 'venda_copo')  { const p = settings.precoVenda.venda_copo;  r.copos += p > 0 ? Math.round(tx.value / p) : 1; }
      if (tx.cat === 'venda_g1l')   { const p = settings.precoVenda.venda_g1l;   r.g1l   += p > 0 ? Math.round(tx.value / p) : 1; }
      if (tx.cat === 'venda_g500')  { const p = settings.precoVenda.venda_g500;  r.g500  += p > 0 ? Math.round(tx.value / p) : 1; }
      if (tx.cat === 'venda_g300')  { const p = settings.precoVenda.venda_g300;  r.g300  += p > 0 ? Math.round(tx.value / p) : 1; }
    }
    return r;
  }, [dayTxs, settings]);

  const adjustField = useCallback((field: keyof Omit<DailyStock, 'id' | 'date'>, delta: number) => {
    const current = (stock[field] as number) ?? 0;
    upsertStock({ ...stock, [field]: Math.max(0, current + delta) });
  }, [stock, upsertStock]);

  function openNumpad(target: NumpadTarget) {
    setNumpadTarget(target);
    setNumpadInput(target.current !== null ? String(target.current) : '');
  }

  function handleNumpadKey(k: string) {
    if (k === '⌫') { setNumpadInput(prev => prev.slice(0, -1)); return; }
    if (numpadInput.length >= 4) return;
    setNumpadInput(prev => (prev === '0' ? k : prev + k));
  }

  function confirmNumpad() {
    if (!numpadTarget) return;
    const val = parseInt(numpadInput) || 0;
    const { type, key } = numpadTarget;
    if (type === 'init')   upsertStock({ ...stock, [key]: val });
    if (type === 'gratis') upsertStock({ ...stock, [`${key}_gratis`]: val });
    if (type === 'sobrou') upsertStock({ ...stock, [`${key}_sobrou`]: val });
    setNumpadTarget(null);
    setNumpadInput('');
  }

  function clearNumpad() {
    if (!numpadTarget) return;
    const { type, key } = numpadTarget;
    if (type === 'sobrou') upsertStock({ ...stock, [`${key}_sobrou`]: null });
    setNumpadTarget(null);
    setNumpadInput('');
  }

  function closeNumpad() {
    setNumpadTarget(null);
    setNumpadInput('');
  }

  const remaining = useMemo(
    () => CONTAINERS.reduce<Record<StockKey, number>>((acc, c) => {
      const gratis = (stock[`${c.key}_gratis` as keyof typeof stock] as number) ?? 0;
      acc[c.key] = stock[c.key] - soldQtys[c.key] - gratis;
      return acc;
    }, {} as Record<StockKey, number>),
    [stock, soldQtys]
  );

  const conciliacao = useMemo(() => CONTAINERS.map(c => {
    const inicio    = stock[c.key];
    const vendas    = soldQtys[c.key];
    const gratis    = (stock[`${c.key}_gratis` as keyof typeof stock] as number) ?? 0;
    const sobrou    = stock[`${c.key}_sobrou` as keyof typeof stock] as number | null;
    const esperado  = inicio - vendas - gratis;
    const diferenca = sobrou !== null ? sobrou - esperado : null;
    return { ...c, inicio, vendas, gratis, sobrou, esperado, diferenca };
  }), [stock, soldQtys]);

  const hasConciliacao = conciliacao.some(c => c.sobrou !== null);
  const formattedDate  = formatFullDate(date);

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#f0f9ff' }}>

      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-6 flex-shrink-0" style={{ background: 'linear-gradient(160deg, #0c4a6e 0%, #0369a1 100%)' }}>
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-4 active:opacity-70 transition-opacity"
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <ArrowLeft size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Voltar ao Relatório
          </span>
        </button>

        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Package size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.6)' }}>Editar Estoque</p>
            <h1 className="text-xl font-black" style={{ color: '#fff' }}>Estoque do Dia</h1>
          </div>
        </div>
        <p className="text-xs mt-3 capitalize" style={{ color: 'rgba(255,255,255,0.65)' }}>{formattedDate}</p>

        <div className="grid grid-cols-4 gap-2 mt-4">
          {CONTAINERS.map(c => {
            const rem = remaining[c.key];
            return (
              <div key={c.key} className="rounded-2xl px-2 py-2.5 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <p className="text-lg leading-none">{c.emoji}</p>
                <p className="text-base font-black mt-1" style={{ color: rem < 0 ? '#fca5a5' : '#fff' }}>{rem}</p>
                <p className="text-[8px] font-bold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>restam</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* ── Estoque Inicial ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Package size={14} color="#0369a1" />
            <p className="text-[11px] font-black tracking-widest uppercase" style={{ color: '#0369a1' }}>Início do Dia</p>
            {isLoading && <span className="text-[10px] ml-auto" style={{ color: '#94a3b8' }}>carregando...</span>}
          </div>
          <div className="space-y-2.5">
            {CONTAINERS.map(c => (
              <StepperRow
                key={c.key}
                container={c}
                value={stock[c.key]}
                isLoading={isLoading}
                onInc={() => adjustField(c.key, 1)}
                onDec={() => adjustField(c.key, -1)}
                onTapValue={() => openNumpad({ type: 'init', key: c.key, label: c.label, emoji: c.emoji, color: c.color, current: stock[c.key], canClear: false })}
              />
            ))}
          </div>
        </section>

        {/* ── Dado de Graça ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Gift size={14} color="#7c3aed" />
            <p className="text-[11px] font-black tracking-widest uppercase" style={{ color: '#7c3aed' }}>Dado de Graça</p>
            <span className="ml-auto rounded-full px-2 py-0.5 text-[9px] font-black" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
              não conta como venda
            </span>
          </div>
          <div className="mb-3 rounded-2xl px-4 py-3 flex items-center gap-2" style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}>
            <Gift size={13} color="#a855f7" />
            <p className="text-xs" style={{ color: '#6b21a8' }}>
              Registre itens dados de graça. Saem do estoque mas não geram receita.
            </p>
          </div>
          <div className="space-y-2.5">
            {CONTAINERS.map(c => {
              const val = (stock[`${c.key}_gratis` as keyof typeof stock] as number) ?? 0;
              return (
                <StepperRow
                  key={c.key}
                  container={c}
                  value={val}
                  isLoading={isLoading}
                  onInc={() => adjustField(`${c.key}_gratis` as keyof Omit<DailyStock, 'id' | 'date'>, 1)}
                  onDec={() => adjustField(`${c.key}_gratis` as keyof Omit<DailyStock, 'id' | 'date'>, -1)}
                  onTapValue={() => openNumpad({ type: 'gratis', key: c.key, label: c.label, emoji: c.emoji, color: '#7c3aed', current: val, canClear: false })}
                  accentColor="#7c3aed"
                />
              );
            })}
          </div>
        </section>

        {/* ── Vendas do Dia ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={14} color="#059669" />
            <p className="text-[11px] font-black tracking-widest uppercase" style={{ color: '#059669' }}>Vendas do Dia</p>
            <span className="ml-auto text-[9px] font-bold" style={{ color: '#94a3b8' }}>somente leitura</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {CONTAINERS.map(c => {
              const sold = soldQtys[c.key];
              return (
                <div key={c.key} className="rounded-2xl px-4 py-3.5" style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <p className="text-lg">{c.emoji}</p>
                  <p className="text-2xl font-black mt-1 tabular-nums" style={{ color: sold > 0 ? '#059669' : '#94a3b8' }}>{sold}</p>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color: '#94a3b8' }}>{c.label.toLowerCase()} vendidos</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Saldo ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} color="#7c3aed" />
            <p className="text-[11px] font-black tracking-widest uppercase" style={{ color: '#7c3aed' }}>Saldo</p>
          </div>
          <div className="space-y-2.5">
            {CONTAINERS.map(c => {
              const init   = stock[c.key];
              const sold   = soldQtys[c.key];
              const gratis = (stock[`${c.key}_gratis` as keyof typeof stock] as number) ?? 0;
              const rem    = remaining[c.key];
              const saidas = sold + gratis;
              const pct    = init > 0 ? Math.min(100, Math.max(0, (saidas / init) * 100)) : 0;
              const isNeg  = rem < 0;

              return (
                <div key={c.key} className="rounded-2xl px-4 py-3.5" style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: isNeg ? '1.5px solid #fca5a5' : '1.5px solid transparent' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.emoji}</span>
                      <span className="text-sm font-bold" style={{ color: '#334155' }}>{c.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: '#94a3b8' }}>
                        {saidas}/{init}{gratis > 0 && <span style={{ color: '#a855f7' }}> ({gratis} grátis)</span>}
                      </span>
                      <span className="text-sm font-black tabular-nums" style={{ color: isNeg ? '#dc2626' : rem === 0 && init > 0 ? '#059669' : c.color }}>
                        {rem >= 0 ? rem : `−${Math.abs(rem)}`}
                      </span>
                    </div>
                  </div>
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: '#f1f5f9' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct >= 100 ? '#059669' : c.color }} />
                  </div>
                  {init > 0 && (
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[9px]" style={{ color: '#94a3b8' }}>saídas: {Math.round(pct)}%</span>
                      {isNeg && <span className="text-[9px] font-bold" style={{ color: '#dc2626' }}>atenção: mais que o estoque!</span>}
                      {!isNeg && rem === 0 && init > 0 && <span className="text-[9px] font-bold" style={{ color: '#059669' }}>tudo vendido! ✓</span>}
                    </div>
                  )}
                  {init === 0 && <p className="text-[10px] mt-1" style={{ color: '#cbd5e1' }}>defina o estoque inicial acima</p>}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Conciliação ── */}
        <section>
          <button
            onClick={() => setShowConciliacao(v => !v)}
            className="w-full flex items-center gap-2 mb-3 active:opacity-70 transition-opacity"
          >
            <ClipboardCheck size={14} color="#0369a1" />
            <p className="text-[11px] font-black tracking-widest uppercase" style={{ color: '#0369a1' }}>
              Conciliação de Estoque
            </p>
            {hasConciliacao && (
              <span className="ml-1 rounded-full px-2 py-0.5 text-[9px] font-black" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                preenchida
              </span>
            )}
            <span className="ml-auto" style={{ color: '#94a3b8' }}>
              {showConciliacao ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          {showConciliacao && (
            <>
              <div className="mb-4 rounded-2xl px-4 py-3 flex items-start gap-2" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <ClipboardCheck size={13} color="#3b82f6" className="mt-0.5 flex-shrink-0" />
                <p className="text-xs" style={{ color: '#1e40af' }}>
                  Informe quanto de cada item sobrou fisicamente. O sistema mostra se há lançamentos faltando ou a mais.
                </p>
              </div>

              <div className="space-y-3">
                {conciliacao.map(c => {
                  const { sobrou, diferenca } = c;

                  return (
                    <div
                      key={c.key}
                      className="rounded-2xl px-4 py-4"
                      style={{
                        background: '#fff',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        border: diferenca === null ? '1.5px solid #e2e8f0'
                          : diferenca === 0 ? '1.5px solid #6ee7b7'
                          : diferenca > 0   ? '1.5px solid #fcd34d'
                          : '1.5px solid #fca5a5',
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{c.emoji}</span>
                          <span className="text-sm font-black" style={{ color: '#0f172a' }}>{c.label}</span>
                        </div>
                        {diferenca !== null && (
                          <span
                            className="text-[10px] font-black rounded-full px-2 py-0.5"
                            style={{
                              background: diferenca === 0 ? '#d1fae5' : diferenca > 0 ? '#fef9c3' : '#fee2e2',
                              color:      diferenca === 0 ? '#059669' : diferenca > 0 ? '#d97706' : '#dc2626',
                            }}
                          >
                            {diferenca === 0 ? '✓ Conferido' : diferenca > 0 ? `+${diferenca} a mais` : `${Math.abs(diferenca)} faltam`}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { label: 'Início', value: c.inicio, color: '#475569' },
                          { label: 'Vendas', value: c.vendas, color: '#059669' },
                          { label: 'Grátis', value: c.gratis, color: '#7c3aed' },
                        ].map(item => (
                          <div key={item.label} className="rounded-xl px-2 py-2 text-center" style={{ background: '#f8fafc' }}>
                            <p className="text-base font-black tabular-nums" style={{ color: item.color }}>{item.value}</p>
                            <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: '#94a3b8' }}>{item.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 h-px" style={{ background: '#f1f5f9' }} />
                        <p className="text-[9px] font-black tracking-widest uppercase" style={{ color: '#94a3b8' }}>
                          esperado: <span style={{ color: '#475569' }}>{c.esperado}</span>
                        </p>
                        <div className="flex-1 h-px" style={{ background: '#f1f5f9' }} />
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>
                          Quantos sobraram de fato?
                        </p>

                        {sobrou !== null ? (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => upsertStock({ ...stock, [`${c.key}_sobrou`]: Math.max(0, sobrou - 1) })}
                              className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
                              style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0' }}
                              disabled={sobrou === 0 || isLoading}
                            >
                              <Minus size={16} color={sobrou === 0 ? '#cbd5e1' : '#475569'} strokeWidth={2.5} />
                            </button>

                            <button
                              onClick={() => openNumpad({ type: 'sobrou', key: c.key, label: c.label, emoji: c.emoji, color: c.color, current: sobrou, canClear: true })}
                              className="flex-1 flex flex-col items-center active:scale-95 transition-transform"
                            >
                              <span className="text-3xl font-black tabular-nums" style={{ color: c.color }}>{sobrou}</span>
                              <span className="text-[9px] font-bold mt-0.5" style={{ color: '#94a3b8' }}>toque para editar</span>
                            </button>

                            <button
                              onClick={() => upsertStock({ ...stock, [`${c.key}_sobrou`]: sobrou + 1 })}
                              className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
                              style={{ background: c.color }}
                              disabled={isLoading}
                            >
                              <Plus size={16} color="#fff" strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openNumpad({ type: 'sobrou', key: c.key, label: c.label, emoji: c.emoji, color: c.color, current: null, canClear: false })}
                            className="w-full rounded-2xl py-3.5 text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                            style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1', color: '#94a3b8' }}
                          >
                            <ClipboardCheck size={15} />
                            Tocar para informar quantidade
                          </button>
                        )}

                        {diferenca !== null && diferenca !== 0 && (
                          <div
                            className="mt-2.5 rounded-xl px-3 py-2"
                            style={{ background: diferenca > 0 ? '#fefce8' : '#fef2f2', border: `1px solid ${diferenca > 0 ? '#fde68a' : '#fecaca'}` }}
                          >
                            <p className="text-xs font-bold" style={{ color: diferenca > 0 ? '#92400e' : '#991b1b' }}>
                              {diferenca > 0
                                ? `Lançou ${diferenca} unidade${diferenca > 1 ? 's' : ''} a mais do que saiu fisicamente.`
                                : `Faltam ${Math.abs(diferenca)} lançamento${Math.abs(diferenca) > 1 ? 's' : ''} — ${Math.abs(diferenca)} unidade${Math.abs(diferenca) > 1 ? 's' : ''} saiu sem registro.`}
                            </p>
                          </div>
                        )}
                        {diferenca === 0 && (
                          <div className="mt-2.5 rounded-xl px-3 py-2" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                            <p className="text-xs font-bold" style={{ color: '#065f46' }}>Tudo conferido! Estoque bate com os lançamentos. ✓</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <div className="h-4" />
      </div>

      {numpadTarget && (
        <NumpadSheet
          target={numpadTarget}
          input={numpadInput}
          onKey={handleNumpadKey}
          onConfirm={confirmNumpad}
          onClear={clearNumpad}
          onClose={closeNumpad}
        />
      )}
    </div>
  );
}
