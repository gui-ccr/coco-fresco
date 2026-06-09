import { memo, useState } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Pencil, Package } from 'lucide-react';
import { type Transaction, CATEGORY_META } from '@/shared/types/transaction';
import { type WorkDay } from '@/shared/types/workDay';
import { formatBRL, formatFullDate, formatShortDate, toLocalDate } from '@/shared/lib/format';
import { TransactionItem } from '@/shared/components/TransactionItem';

export interface DaySummary {
  workDay:    WorkDay;
  entradas:   number;
  saidas:     number;
  saldoFinal: number;
  txs:        Transaction[];
}

export function buildSummaries(workDays: WorkDay[], transactions: Transaction[]): DaySummary[] {
  return workDays.map(wd => {
    const txs      = transactions.filter(t => toLocalDate(t.when) === wd.date);
    const entradas = txs.filter(t =>  CATEGORY_META[t.cat].isIncome).reduce((s, t) => s + t.value, 0);
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

interface DayCardProps {
  summary:       DaySummary;
  onEdit?:       (tx: Transaction) => void;
  onDelete?:     (id: string) => void;
  onEditStock?:  (date: string) => void;
}

export const DayCard = memo(function DayCard({ summary, onEdit, onDelete, onEditStock }: DayCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { workDay, entradas, saidas, saldoFinal } = summary;
  const isEditable = !!(onEdit || onDelete);
  const isToday    = workDay.date === new Date().toLocaleDateString('en-CA');
  const isPositive = saldoFinal >= 0;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
    >
      <button onClick={() => setExpanded(v => !v)} className="w-full text-left">
        <div className="px-5 pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: isToday ? '#d1fae5' : '#f1f5f9' }}
              >
                <span className="text-sm">{isToday ? '📅' : '📆'}</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-black uppercase tracking-wider" style={{ color: isToday ? '#059669' : '#94a3b8' }}>
                    {isToday ? 'Hoje' : formatShortDate(workDay.date)}
                  </p>
                  {isEditable && summary.txs.length > 0 && (
                    <div
                      className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5"
                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
                    >
                      <Pencil size={8} style={{ color: '#2563eb' }} />
                      <span className="text-[8px] font-black" style={{ color: '#2563eb' }}>editável</span>
                    </div>
                  )}
                </div>
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
                <p className="text-sm font-black tabular-nums" style={{ color: isPositive ? '#059669' : '#dc2626' }}>
                  {formatBRL(saldoFinal)}
                </p>
              </div>
              {expanded
                ? <ChevronUp   size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
                : <ChevronDown size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
              }
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl p-3 flex flex-col gap-0.5" style={{ background: '#f0fdf4' }}>
              <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: '#059669' }}>Capital</p>
              <p className="text-sm font-black tabular-nums" style={{ color: '#059669' }}>{formatBRL(workDay.capitalInit)}</p>
            </div>
            <div className="rounded-xl p-3 flex flex-col gap-0.5" style={{ background: '#f0fdf4' }}>
              <div className="flex items-center gap-1">
                <TrendingUp size={9} style={{ color: '#059669' }} />
                <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: '#059669' }}>Entrou</p>
              </div>
              <p className="text-sm font-black tabular-nums" style={{ color: '#059669' }}>{formatBRL(entradas)}</p>
            </div>
            <div className="rounded-xl p-3 flex flex-col gap-0.5" style={{ background: '#fff7ed' }}>
              <div className="flex items-center gap-1">
                <TrendingDown size={9} style={{ color: '#f97316' }} />
                <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: '#f97316' }}>Saiu</p>
              </div>
              <p className="text-sm font-black tabular-nums" style={{ color: '#f97316' }}>{formatBRL(saidas)}</p>
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 pt-0" style={{ borderTop: '1px solid #f1f5f9' }}>
          {summary.txs.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: '#94a3b8' }}>
              Nenhuma movimentação neste dia.
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
              {summary.txs.map(tx => (
                <TransactionItem
                  key={tx.id}
                  tx={tx}
                  variant="compact"
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}

          {onEditStock && (
            <button
              onClick={e => { e.stopPropagation(); onEditStock(workDay.date); }}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold active:scale-95 transition-all"
              style={{
                background: 'linear-gradient(135deg, #0c4a6e, #0369a1)',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(3,105,161,0.3)',
              }}
            >
              <Package size={15} />
              Editar Estoque deste Dia
            </button>
          )}
        </div>
      )}
    </div>
  );
});
