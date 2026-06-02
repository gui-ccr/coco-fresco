import { memo } from 'react';
import { type Transaction, CATEGORY_META } from '@/shared/types/transaction';
import { formatBRL, formatDateShort, formatDayMonth } from '@/shared/lib/format';

interface TransactionItemProps {
  tx:       Transaction;
  variant?: 'compact' | 'detailed';
  hidden?:  boolean;
}

export const TransactionItem = memo(function TransactionItem({ tx, variant = 'compact', hidden }: TransactionItemProps) {
  const meta      = CATEGORY_META[tx.cat];
  const isDetailed = variant === 'detailed';

  return (
    <div className="flex items-center gap-3" style={{ paddingTop: isDetailed ? 14 : 12, paddingBottom: isDetailed ? 14 : 12 }}>
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width:        isDetailed ? 44 : 40,
          height:       isDetailed ? 44 : 40,
          borderRadius: isDetailed ? 16 : 12,
          background:   meta.bg,
          fontSize:     isDetailed ? 20 : 18,
        }}
      >
        {meta.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: '#0f172a' }}>{meta.label}</p>
        <p className="text-xs truncate" style={{ color: isDetailed && tx.note ? '#94a3b8' : '#94a3b8' }}>
          {tx.note || formatDateShort(tx.when)}
        </p>
      </div>

      <div className={`flex-shrink-0 ${isDetailed ? 'flex flex-col items-end' : ''}`}>
        <p className="text-sm font-black tabular-nums" style={{ color: meta.isIncome ? '#059669' : meta.color }}>
          {hidden ? 'R$ ••••' : `${meta.isIncome ? '+' : '−'} ${formatBRL(tx.value)}`}
        </p>
        {isDetailed && (
          <p className="text-[10px]" style={{ color: '#cbd5e1' }}>
            {formatDayMonth(tx.when)}
          </p>
        )}
      </div>
    </div>
  );
});
