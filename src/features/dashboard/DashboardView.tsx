import { useMemo, useState, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { TrendingUp, TrendingDown, AlertCircle, Wallet } from 'lucide-react';
import { CATEGORY_META } from '@/shared/types/transaction';
import { formatBRL, greeting, toLocalDate, todayDate } from '@/shared/lib/format';
import { TransactionItem } from '@/shared/components/TransactionItem';
import { Pagination } from '@/shared/components/Pagination';
import { AnimatedTitle } from './components/AnimatedTitle';
import { StatCard } from './components/StatCard';
import { AREA_COLORS } from './constants/areaColors';
import { useTransactionsQuery } from '@/shared/hooks/queries/useTransactionsQuery';
import { useWorkDayQuery } from '@/shared/hooks/queries/useWorkDayQuery';

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

interface DonutSlice { name: string; value: number; color: string; }

function DonutChart({ data }: { data: DonutSlice[] }) {
  const size = 144;
  const cx = size / 2;
  const cy = size / 2;
  const r = 46;
  const gap = 0.04;

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  let cursor = -Math.PI / 2;
  const slices = data.map(d => {
    const angle = (d.value / total) * (2 * Math.PI) - gap;
    const start = cursor + gap / 2;
    const end = start + angle;
    cursor += (d.value / total) * (2 * Math.PI);

    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = angle > Math.PI ? 1 : 0;

    return { ...d, path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, pct: Math.round((d.value / total) * 100) };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map(s => (
        <path
          key={s.name}
          d={s.path}
          fill="none"
          stroke={s.color}
          strokeWidth={20}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

const PAGE_SIZE = 4;

export function DashboardView() {
  const { data: transactions = [] } = useTransactionsQuery();
  const { today: workDay }          = useWorkDayQuery();

  const today  = todayDate();
  const [txPage, setTxPage] = useState(0);

  const todayTxs = useMemo(
    () => transactions.filter(t => toLocalDate(t.when) === today),
    [transactions, today]
  );

  const {
    totalIncome,
    totalExpenses,
    profit,
    trabalhoExp,
    casaExp,
    aleatorioExp,
    recentTx,
    pieData,
  } = useMemo(() => {
    const totalIncome   = todayTxs.filter(t =>  CATEGORY_META[t.cat].isIncome).reduce((s, t) => s + t.value, 0);
    const totalExpenses = todayTxs.filter(t => !CATEGORY_META[t.cat].isIncome).reduce((s, t) => s + t.value, 0);
    const profit        = totalIncome - totalExpenses;

    const byArea = (area: string) =>
      todayTxs
        .filter(t => !CATEGORY_META[t.cat].isIncome && CATEGORY_META[t.cat].area === area)
        .reduce((s, t) => s + t.value, 0);

    const trabalhoExp  = byArea('trabalho');
    const casaExp      = byArea('casa');
    const aleatorioExp = byArea('aleatorio');

    const pieData = [
      { name: 'Trabalho', value: trabalhoExp,  color: AREA_COLORS.trabalho  },
      { name: 'Casa',     value: casaExp,       color: AREA_COLORS.casa      },
      { name: 'Gastos',   value: aleatorioExp,  color: AREA_COLORS.aleatorio },
    ].filter(d => d.value > 0);

    const recentTx = [...todayTxs]
      .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

    return { totalIncome, totalExpenses, profit, trabalhoExp, casaExp, aleatorioExp, recentTx, pieData };
  }, [todayTxs]);

  const capitalInit = workDay?.capitalInit ?? 0;
  const saldoFinal  = capitalInit + totalIncome - totalExpenses;
  const totalExp    = trabalhoExp + casaExp + aleatorioExp;
  const pct         = (v: number) => totalExp > 0 ? Math.round((v / totalExp) * 100) : 0;

  return (
    <div>
      {/* ─── Header ─── */}
      <div
        className="relative px-5 pt-14 pb-10"
        style={{
          background: 'linear-gradient(160deg, #064e3b 0%, #065f46 55%, #047857 100%)',
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
          <p className="text-emerald-300 text-sm font-semibold mb-1">{greeting()} 👋</p>
          <AnimatedTitle />
          <p className="text-emerald-300 text-xs font-medium">
            {new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date())}
          </p>

          <div
            className="mt-6 rounded-2xl p-5"
            style={{
              background: 'rgba(0,0,0,0.18)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <p className="text-emerald-300 text-xs font-bold tracking-widest uppercase mb-2">
              Saldo atual do dia
            </p>
            <p
              className="text-4xl font-black tabular-nums leading-none mb-4"
              style={{ color: saldoFinal >= 0 ? '#6ee7b7' : '#fca5a5' }}
            >
              {formatBRL(saldoFinal)}
            </p>
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Wallet size={13} className="text-yellow-300" />
                <span className="text-white text-xs font-bold">{formatBRL(capitalInit)}</span>
                <span className="text-yellow-300 text-[10px]">capital</span>
              </div>
              <div className="w-px bg-white opacity-20" />
              <div className="flex items-center gap-1.5">
                <TrendingUp size={13} className="text-emerald-400" />
                <span className="text-white text-xs font-bold">{formatBRL(totalIncome)}</span>
                <span className="text-emerald-400 text-[10px]">entrou</span>
              </div>
              <div className="w-px bg-white opacity-20" />
              <div className="flex items-center gap-1.5">
                <TrendingDown size={13} className="text-red-300" />
                <span className="text-white text-xs font-bold">{formatBRL(totalExpenses)}</span>
                <span className="text-red-300 text-[10px]">saiu</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="px-4 pt-5 space-y-5">
        <div className="flex gap-3">
          <StatCard label="Vendas hoje" value={totalIncome}   icon="💚" isPositive={true}  />
          <StatCard label="Gastos hoje" value={totalExpenses} icon="🔴" isPositive={false} />
        </div>

        <div
          className="rounded-2xl px-5 py-4 flex items-center justify-between"
          style={{
            background: profit >= 0 ? '#d1fae5' : '#fee2e2',
            border: `1.5px solid ${profit >= 0 ? '#6ee7b7' : '#fca5a5'}`,
          }}
        >
          <div>
            <p
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: profit >= 0 ? '#065f46' : '#991b1b' }}
            >
              Lucro / Detrimento hoje
            </p>
            <p
              className="text-2xl font-black tabular-nums mt-0.5"
              style={{ color: profit >= 0 ? '#059669' : '#dc2626' }}
            >
              {profit >= 0 ? '+' : ''}{formatBRL(profit)}
            </p>
          </div>
          <span className="text-4xl">{profit >= 0 ? '📈' : '📉'}</span>
        </div>

        {totalExp > 0 ? (
          <div
            className="rounded-2xl p-5"
            style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
          >
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#94a3b8' }}>
              Para onde foi o dinheiro?
            </p>
            <div className="flex items-center gap-4">
              <div className="w-36 h-36 flex-shrink-0">
                <DonutChart data={pieData} />
              </div>
              <div className="flex-1 space-y-3">
                {[
                  { label: 'Trabalho', value: trabalhoExp,  color: AREA_COLORS.trabalho,  emoji: '🌴' },
                  { label: 'Casa',     value: casaExp,       color: AREA_COLORS.casa,       emoji: '🏠' },
                  { label: 'Gastos',   value: aleatorioExp,  color: AREA_COLORS.aleatorio,  emoji: '🛍️' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{item.emoji}</span>
                        <span className="text-xs font-semibold" style={{ color: '#475569' }}>{item.label}</span>
                      </div>
                      <span className="text-xs font-black tabular-nums" style={{ color: item.color }}>
                        {pct(item.value)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct(item.value)}%`, background: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-5 flex items-center gap-3"
            style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
          >
            <AlertCircle size={20} style={{ color: '#94a3b8' }} />
            <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>
              Nenhum gasto registrado hoje.
            </p>
          </div>
        )}

        <div
          className="rounded-2xl p-5"
          style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
        >
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#94a3b8' }}>
            Movimentações de hoje
          </p>
          {recentTx.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: '#94a3b8' }}>
              Nada registrado ainda hoje. Que tal adicionar a primeira venda? 🥥
            </p>
          ) : (
            <>
              <AnimatedList page={txPage}>
                <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                  {recentTx.slice(txPage * PAGE_SIZE, txPage * PAGE_SIZE + PAGE_SIZE).map(tx => (
                    <TransactionItem key={tx.id} tx={tx} />
                  ))}
                </div>
              </AnimatedList>
              <Pagination page={txPage} total={recentTx.length} pageSize={PAGE_SIZE} onChange={setTxPage} />
            </>
          )}
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}
