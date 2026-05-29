import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react';
import { type Transaction,  CATEGORY_META } from '@/shared/types/transaction';
import { type WorkDay } from '@/shared/types/workDay';
import { formatBRL, formatFullDate, formatShortDate, toLocalDate } from '@/shared/lib/format';
import { TransactionItem } from '@/shared/components/TransactionItem';

interface Props {
  transactions: Transaction[];
  workDays: WorkDay[];
}

interface DaySummary {
  workDay: WorkDay;
  entradas: number;
  saidas: number;
  saldoFinal: number;
  txs: Transaction[];
}

function buildSummaries(workDays: WorkDay[], transactions: Transaction[]): DaySummary[] {
  return workDays.map(wd => {
    const txs = transactions.filter(t => toLocalDate(t.when) === wd.date);
    const entradas = txs.filter(t => CATEGORY_META[t.cat].isIncome).reduce((s, t) => s + t.value, 0);
    const saidas   = txs.filter(t => !CATEGORY_META[t.cat].isIncome).reduce((s, t) => s + t.value, 0);
    return {
      workDay:    wd,
      entradas,
      saidas,
      saldoFinal: wd.capitalInit + entradas - saidas,
      txs:        [...txs].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()),
    };
  });
}

function DayCard({ summary }: { summary: DaySummary }) {
  const [expanded, setExpanded] = useState(false);
  const { workDay, entradas, saidas, saldoFinal } = summary;
  const isToday = workDay.date === new Date().toLocaleDateString('en-CA');
  const isPositive = saldoFinal >= 0;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
    >
      {/* Header do card */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left"
      >
        <div className="px-5 pt-4 pb-4">
          {/* Data */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: isToday ? '#d1fae5' : '#f1f5f9' }}
              >
                <span className="text-sm">{isToday ? '📅' : '📆'}</span>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider" style={{ color: isToday ? '#059669' : '#94a3b8' }}>
                  {isToday ? 'Hoje' : formatShortDate(workDay.date)}
                </p>
                <p className="text-sm font-bold capitalize" style={{ color: '#0f172a' }}>
                  {formatFullDate(workDay.date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="rounded-xl px-3 py-1.5"
                style={{ background: isPositive ? '#d1fae5' : '#fee2e2' }}
              >
                <p
                  className="text-sm font-black tabular-nums"
                  style={{ color: isPositive ? '#059669' : '#dc2626' }}
                >
                  {formatBRL(saldoFinal)}
                </p>
              </div>
              {expanded
                ? <ChevronUp size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                : <ChevronDown size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
              }
            </div>
          </div>

          {/* Resumo do dia */}
          <div className="grid grid-cols-3 gap-2">
            <div
              className="rounded-xl p-3 flex flex-col gap-0.5"
              style={{ background: '#f0fdf4' }}
            >
              <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: '#059669' }}>Capital</p>
              <p className="text-sm font-black tabular-nums" style={{ color: '#059669' }}>{formatBRL(workDay.capitalInit)}</p>
            </div>
            <div
              className="rounded-xl p-3 flex flex-col gap-0.5"
              style={{ background: '#f0fdf4' }}
            >
              <div className="flex items-center gap-1">
                <TrendingUp size={9} style={{ color: '#059669' }} />
                <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: '#059669' }}>Entrou</p>
              </div>
              <p className="text-sm font-black tabular-nums" style={{ color: '#059669' }}>{formatBRL(entradas)}</p>
            </div>
            <div
              className="rounded-xl p-3 flex flex-col gap-0.5"
              style={{ background: '#fff7ed' }}
            >
              <div className="flex items-center gap-1">
                <TrendingDown size={9} style={{ color: '#f97316' }} />
                <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: '#f97316' }}>Saiu</p>
              </div>
              <p className="text-sm font-black tabular-nums" style={{ color: '#f97316' }}>{formatBRL(saidas)}</p>
            </div>
          </div>
        </div>
      </button>

      {/* Transações do dia (expansível) */}
      {expanded && (
        <div
          className="px-5 pb-4 pt-0"
          style={{ borderTop: '1px solid #f1f5f9' }}
        >
          {summary.txs.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: '#94a3b8' }}>
              Nenhuma movimentação neste dia.
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
              {summary.txs.map(tx => (
                <TransactionItem key={tx.id} tx={tx} variant="compact" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RelatorioView({ transactions, workDays }: Props) {
  const summaries = useMemo(
    () => buildSummaries(workDays, transactions),
    [workDays, transactions]
  );

  const totals = useMemo(() => ({
    totalEntradas: summaries.reduce((s, d) => s + d.entradas, 0),
    totalSaidas:   summaries.reduce((s, d) => s + d.saidas, 0),
    totalDias:     summaries.length,
  }), [summaries]);

  return (
    <div>
      {/* ─── Header ─── */}
      <div
        className="relative px-5 pt-14 pb-8"
        style={{
          background: 'linear-gradient(160deg, #1e1b4b, #3730a3)',
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
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={16} className="text-indigo-300" />
            <p className="text-indigo-300 text-sm font-semibold">Histórico</p>
          </div>
          <h1 className="text-white text-2xl font-black">Relatório por Dia</h1>

          {/* Total geral */}
          {totals.totalDias > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div
                className="rounded-2xl p-3"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.18)' }}
              >
                <p className="text-indigo-300 text-[9px] font-black uppercase tracking-wider mb-1">Dias</p>
                <p className="text-white text-xl font-black">{totals.totalDias}</p>
              </div>
              <div
                className="rounded-2xl p-3"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.18)' }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp size={10} className="text-emerald-400" />
                  <p className="text-emerald-300 text-[9px] font-black uppercase tracking-wider">Entrou</p>
                </div>
                <p className="text-white text-sm font-black tabular-nums">{formatBRL(totals.totalEntradas)}</p>
              </div>
              <div
                className="rounded-2xl p-3"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.18)' }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <TrendingDown size={10} className="text-red-300" />
                  <p className="text-red-300 text-[9px] font-black uppercase tracking-wider">Saiu</p>
                </div>
                <p className="text-white text-sm font-black tabular-nums">{formatBRL(totals.totalSaidas)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Lista de dias ─── */}
      <div className="px-4 pt-5 space-y-3 pb-8">
        {summaries.length === 0 ? (
          <div
            className="rounded-2xl p-8 flex flex-col items-center gap-3"
            style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
          >
            <Wallet size={36} style={{ color: '#cbd5e1' }} />
            <p className="text-sm font-medium text-center" style={{ color: '#94a3b8' }}>
              Nenhum dia registrado ainda.
            </p>
          </div>
        ) : (
          summaries.map(s => <DayCard key={s.workDay.id} summary={s} />)
        )}
      </div>
    </div>
  );
}
