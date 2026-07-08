import { useMemo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { TrendingUp, TrendingDown, PackageOpen, Plus, Calendar } from 'lucide-react';
import { type Transaction, CATEGORY_META } from '@/shared/types/transaction';
import { type AreaId, AREA_META } from '@/shared/types/area';
import { formatBRL } from '@/shared/lib/format';
import { TransactionItem } from '@/shared/components/TransactionItem';
import { Pagination } from '@/shared/components/Pagination';
import { useTransactionsQuery } from '@/shared/hooks/queries/useTransactionsQuery';

// ─── Período ──────────────────────────────────────────────────────────────────

type Period = 'hoje' | 'semana' | 'mes' | 'total';

const PERIOD_LABELS: Record<Period, string> = {
  hoje:   'Hoje',
  semana: 'Semana',
  mes:    'Mês',
  total:  'Total',
};

function getPeriodBounds(period: Period): { start: Date | null; end: Date } {
  const now   = new Date();
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (period === 'hoje') {
    return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end };
  }
  if (period === 'semana') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return { start, end };
  }
  if (period === 'mes') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end };
  }
  return { start: null, end };
}

function getPeriodDescription(period: Period): string {
  const now = new Date();
  const fmt = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');

  if (period === 'hoje') {
    return now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  }
  if (period === 'semana') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return `${fmt(start)} – ${fmt(now)}`;
  }
  if (period === 'mes') {
    return now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }
  return 'Todo o histórico';
}

// ─── Componentes internos ─────────────────────────────────────────────────────

interface Props {
  areaId:    AreaId;
  onAdd?:    () => void;
  onEdit?:   (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}

const PAGE_SIZE = 4;

function AnimatedList({ page, children }: { page: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' }
    );
  }, [page]);
  return <div ref={ref}>{children}</div>;
}

// ─── AreaView ─────────────────────────────────────────────────────────────────

export function AreaView({ areaId, onAdd, onEdit, onDelete }: Props) {
  const { data: transactions = [] } = useTransactionsQuery();
  const areaMeta = AREA_META[areaId];

  const [period, setPeriod]   = useState<Period>('mes');
  const [page,   setPage]     = useState(0);

  useEffect(() => { setPage(0); }, [areaId]);
  useEffect(() => { setPage(0); }, [period]);

  // Todas as transações desta área
  const areaTransactions = useMemo(
    () => transactions.filter(t => CATEGORY_META[t.cat].area === areaId),
    [transactions, areaId]
  );

  // Filtradas pelo período selecionado
  const filteredTransactions = useMemo(() => {
    const { start, end } = getPeriodBounds(period);
    if (!start) return areaTransactions;
    return areaTransactions.filter(t => {
      const d = new Date(t.when);
      return d >= start && d <= end;
    });
  }, [areaTransactions, period]);

  const { income, expenses, byCategory } = useMemo(() => {
    const income   = filteredTransactions.filter(t =>  CATEGORY_META[t.cat].isIncome && !t.is_fiado).reduce((s, t) => s + t.value, 0);
    const expenses = filteredTransactions.filter(t => !CATEGORY_META[t.cat].isIncome && !t.no_caixa).reduce((s, t) => s + t.value, 0);

    const byCategory = filteredTransactions.reduce<
      Record<string, { meta: typeof CATEGORY_META[keyof typeof CATEGORY_META]; total: number; count: number }>
    >((acc, tx) => {
      if (!acc[tx.cat]) acc[tx.cat] = { meta: CATEGORY_META[tx.cat], total: 0, count: 0 };
      acc[tx.cat].total += tx.value;
      acc[tx.cat].count += 1;
      return acc;
    }, {});

    return { income, expenses, byCategory };
  }, [filteredTransactions]);

  const net = income - expenses;

  const sortedTx = useMemo(
    () => [...filteredTransactions].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()),
    [filteredTransactions]
  );

  const periodDescription = getPeriodDescription(period);

  return (
    <div>
      {/* ─── Header ─── */}
      <div
        className="relative px-5 pt-14 pb-6"
        style={{
          background: `linear-gradient(160deg, ${areaMeta.gradientFrom}, ${areaMeta.gradientTo})`,
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

          {/* Título + botão novo */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/60 text-sm font-semibold mb-1 capitalize">
                {areaId === 'aleatorio' ? 'gastos extras' : areaId}
              </p>
              <h1 className="text-white text-2xl font-black leading-tight">
                {areaMeta.emoji} {areaMeta.label}
              </h1>
            </div>
            {onAdd && (
              <button
                onClick={onAdd}
                className="flex items-center gap-1.5 rounded-2xl px-4 py-2.5 active:scale-95 transition-all duration-100"
                style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.35)' }}
              >
                <Plus size={15} className="text-white" strokeWidth={2.8} />
                <span className="text-xs font-black text-white">Novo registro</span>
              </button>
            )}
          </div>

          {/* ── Seletor de período ── */}
          <div className="flex gap-2 mb-4">
            {(['hoje', 'semana', 'mes', 'total'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="flex-1 rounded-xl py-1.5 text-[11px] font-black tracking-wide transition-all duration-150 active:scale-95"
                style={
                  period === p
                    ? { background: 'rgba(255,255,255,0.95)', color: areaMeta.gradientFrom }
                    : { background: 'rgba(0,0,0,0.18)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)' }
                }
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          {/* ── Label descritivo do período ── */}
          <div
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 mb-4"
            style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Calendar size={12} className="text-white/60 flex-shrink-0" />
            <p className="text-white/80 text-[11px] font-semibold capitalize truncate">
              {periodDescription}
            </p>
            <span
              className="ml-auto flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
            >
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 gap-3">
            {income > 0 && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={14} className="text-white/70" />
                  <p className="text-white/70 text-[10px] font-bold tracking-wider uppercase">Entrou</p>
                </div>
                <p className="text-white text-xl font-black tabular-nums">{formatBRL(income)}</p>
              </div>
            )}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown size={14} className="text-white/70" />
                <p className="text-white/70 text-[10px] font-bold tracking-wider uppercase">Saiu</p>
              </div>
              <p className="text-white text-xl font-black tabular-nums">{formatBRL(expenses)}</p>
            </div>
            {income > 0 && (
              <div
                className="rounded-2xl p-4 col-span-2"
                style={{ background: 'rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <p className="text-white/70 text-[10px] font-bold tracking-wider uppercase mb-1">Resultado</p>
                <p
                  className="text-2xl font-black tabular-nums"
                  style={{ color: net >= 0 ? '#6ee7b7' : '#fca5a5' }}
                >
                  {formatBRL(net)}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="px-4 pt-5 space-y-4">

        {Object.keys(byCategory).length > 0 && (
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-3 px-1" style={{ color: '#94a3b8' }}>
              Por categoria
            </p>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(byCategory).map(([cat, data]) => (
                <div
                  key={cat}
                  className="rounded-2xl p-4"
                  style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{data.meta.emoji}</span>
                    <span className="text-xs font-bold" style={{ color: '#475569' }}>{data.meta.label}</span>
                  </div>
                  <p
                    className="text-lg font-black tabular-nums"
                    style={{ color: data.meta.isIncome ? '#059669' : data.meta.color }}
                  >
                    {formatBRL(data.total)}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>
                    {data.count} {data.count === 1 ? 'registro' : 'registros'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl p-5" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: '#94a3b8' }}>
            Movimentações
          </p>

          {sortedTx.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-3">
              <PackageOpen size={36} style={{ color: '#cbd5e1' }} />
              <p className="text-sm font-medium text-center" style={{ color: '#94a3b8' }}>
                {period === 'total'
                  ? 'Nenhum registro ainda.\nToque no + para adicionar!'
                  : `Nenhum registro ${period === 'hoje' ? 'hoje' : period === 'semana' ? 'esta semana' : 'este mês'}.`}
              </p>
            </div>
          ) : (
            <>
              <AnimatedList page={page}>
                <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                  {sortedTx.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map(tx => (
                    <TransactionItem
                      key={tx.id}
                      tx={tx}
                      variant="detailed"
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </AnimatedList>
              <Pagination page={page} total={sortedTx.length} pageSize={PAGE_SIZE} onChange={setPage} />
            </>
          )}
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}
