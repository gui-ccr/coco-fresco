import { useMemo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { TrendingUp, TrendingDown, PackageOpen, Plus } from 'lucide-react';
import { CATEGORY_META } from '@/shared/types/transaction';
import { type AreaId, AREA_META } from '@/shared/types/area';
import { formatBRL } from '@/shared/lib/format';
import { TransactionItem } from '@/shared/components/TransactionItem';
import { Pagination } from '@/shared/components/Pagination';
import { useTransactionsQuery } from '@/shared/hooks/queries/useTransactionsQuery';

interface Props {
  areaId: AreaId;
  onAdd?: () => void;
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

export function AreaView({ areaId, onAdd }: Props) {
  const { data: transactions = [] } = useTransactionsQuery();
  const areaMeta = AREA_META[areaId];
  const [page, setPage] = useState(0);

  useEffect(() => { setPage(0); }, [areaId]);

  const areaTransactions = useMemo(
    () => transactions.filter(t => CATEGORY_META[t.cat].area === areaId),
    [transactions, areaId]
  );

  const { income, expenses, byCategory } = useMemo(() => {
    const income   = areaTransactions.filter(t =>  CATEGORY_META[t.cat].isIncome).reduce((s, t) => s + t.value, 0);
    const expenses = areaTransactions.filter(t => !CATEGORY_META[t.cat].isIncome).reduce((s, t) => s + t.value, 0);

    const byCategory = areaTransactions.reduce<Record<string, { meta: typeof CATEGORY_META[keyof typeof CATEGORY_META]; total: number; items: typeof areaTransactions }>>(
      (acc, tx) => {
        if (!acc[tx.cat]) acc[tx.cat] = { meta: CATEGORY_META[tx.cat], total: 0, items: [] };
        acc[tx.cat].total += tx.value;
        acc[tx.cat].items.push(tx);
        return acc;
      },
      {}
    );

    return { income, expenses, byCategory };
  }, [areaTransactions]);

  const net = income - expenses;

  const sortedTx = useMemo(
    () => [...areaTransactions].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()),
    [areaTransactions]
  );

  return (
    <div>
      {/* ─── Header ─── */}
      <div
        className="relative px-5 pt-14 pb-8"
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
          <div className="flex items-start justify-between">
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

          <div className="mt-5 grid grid-cols-2 gap-3">
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
                    {data.items.length} {data.items.length === 1 ? 'registro' : 'registros'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl p-5" style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: '#94a3b8' }}>
            Todas as movimentações
          </p>

          {sortedTx.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-3">
              <PackageOpen size={36} style={{ color: '#cbd5e1' }} />
              <p className="text-sm font-medium text-center" style={{ color: '#94a3b8' }}>
                Nenhum registro aqui ainda.{'\n'}Toque no + para adicionar!
              </p>
            </div>
          ) : (
            <>
              <AnimatedList page={page}>
                <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                  {sortedTx.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map(tx => (
                    <TransactionItem key={tx.id} tx={tx} variant="detailed" />
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
