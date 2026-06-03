import { memo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { type Transaction, CATEGORY_META } from '@/shared/types/transaction';
import { formatBRL, formatDateShort, formatDayMonth } from '@/shared/lib/format';

type ActionState = 'idle' | 'actions' | 'confirm-delete';

interface TransactionItemProps {
  tx:        Transaction;
  variant?:  'compact' | 'detailed';
  hidden?:   boolean;
  onEdit?:   (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}

export const TransactionItem = memo(function TransactionItem({
  tx, variant = 'compact', hidden, onEdit, onDelete,
}: TransactionItemProps) {
  const meta         = CATEGORY_META[tx.cat];
  const isDetailed   = variant === 'detailed';
  const isInteractive = !!(onEdit || onDelete);
  const [actionState, setActionState] = useState<ActionState>('idle');

  function handleRowClick() {
    if (!isInteractive) return;
    setActionState(s => s === 'idle' ? 'actions' : 'idle');
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setActionState('idle');
    onEdit?.(tx);
  }

  function handleDeleteRequest(e: React.MouseEvent) {
    e.stopPropagation();
    setActionState('confirm-delete');
  }

  function handleDeleteConfirm(e: React.MouseEvent) {
    e.stopPropagation();
    setActionState('idle');
    onDelete?.(tx.id);
  }

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation();
    setActionState('idle');
  }

  const isExpanded = actionState !== 'idle';

  return (
    <div
      className="rounded-xl transition-colors duration-150"
      style={{ background: isExpanded ? '#f8fafc' : 'transparent' }}
    >
      {/* ─── Main row ─── */}
      <div
        className={`flex items-center gap-3 ${isInteractive ? 'cursor-pointer select-none' : ''}`}
        style={{ paddingTop: isDetailed ? 14 : 12, paddingBottom: isExpanded ? 8 : (isDetailed ? 14 : 12) }}
        onClick={handleRowClick}
      >
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
          <p className="text-xs truncate" style={{ color: '#94a3b8' }}>
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

      {/* ─── Action bar ─── */}
      {actionState === 'actions' && (
        <div className="flex gap-2 pb-3 px-1">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 active:scale-95 transition-all duration-100"
              style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}
            >
              <Pencil size={13} style={{ color: '#2563eb' }} />
              <span className="text-xs font-bold" style={{ color: '#2563eb' }}>Editar</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDeleteRequest}
              className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-4 active:scale-95 transition-all duration-100"
              style={{ background: '#fef2f2', border: '1.5px solid #fecaca' }}
            >
              <Trash2 size={13} style={{ color: '#dc2626' }} />
              <span className="text-xs font-bold" style={{ color: '#dc2626' }}>Excluir</span>
            </button>
          )}
        </div>
      )}

      {/* ─── Delete confirmation ─── */}
      {actionState === 'confirm-delete' && (
        <div className="flex items-center gap-2 pb-3 px-1">
          <p className="flex-1 text-xs font-bold" style={{ color: '#dc2626' }}>
            Excluir este lançamento?
          </p>
          <button
            onClick={handleCancel}
            className="rounded-xl py-2 px-3 active:scale-95 transition-all duration-100"
            style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0' }}
          >
            <span className="text-xs font-bold" style={{ color: '#64748b' }}>Não</span>
          </button>
          <button
            onClick={handleDeleteConfirm}
            className="rounded-xl py-2 px-3 active:scale-95 transition-all duration-100"
            style={{ background: '#dc2626', border: '1.5px solid #b91c1c' }}
          >
            <span className="text-xs font-bold text-white">Excluir</span>
          </button>
        </div>
      )}
    </div>
  );
});
