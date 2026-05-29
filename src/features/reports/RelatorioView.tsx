import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, CalendarDays } from 'lucide-react';
import { type Transaction } from '@/shared/types/transaction';
import { type WorkDay } from '@/shared/types/workDay';
import { formatBRL } from '@/shared/lib/format';
import { DayCard, buildSummaries } from './components/DayCard';

interface Props {
  transactions: Transaction[];
  workDays:     WorkDay[];
}

export function RelatorioView({ transactions, workDays }: Props) {
  const summaries = useMemo(
    () => buildSummaries(workDays, transactions),
    [workDays, transactions]
  );

  const totals = useMemo(() => ({
    totalEntradas: summaries.reduce((s, d) => s + d.entradas, 0),
    totalSaidas:   summaries.reduce((s, d) => s + d.saidas,   0),
    totalDias:     summaries.length,
  }), [summaries]);

  return (
    <div>
      {/* ─── Header ─── */}
      <div
        className="relative px-5 pt-14 pb-8"
        style={{ background: 'linear-gradient(160deg, #1e1b4b, #3730a3)', borderRadius: '0 0 2rem 2rem' }}
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
