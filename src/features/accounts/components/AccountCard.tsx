import { Check, Pencil, Trash2, CalendarDays, AlertCircle } from 'lucide-react';
import { type Account, ACCOUNT_TYPE_META } from '@/shared/types/account';
import { formatBRL } from '@/shared/lib/format';

interface AccountCardProps {
  account:      Account;
  onTogglePaid: (id: string) => void;
  onEdit:       (account: Account) => void;
  onDelete:     (id: string) => void;
}

function isOverdue(dueDate: string): boolean {
  const today = new Date().toLocaleDateString('en-CA');
  return dueDate < today;
}

function formatDue(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    .format(new Date(dateStr + 'T12:00:00'));
}

export function AccountCard({ account, onTogglePaid, onEdit, onDelete }: AccountCardProps) {
  const meta    = ACCOUNT_TYPE_META[account.type];
  const overdue = !account.isPaid && account.dueDate ? isOverdue(account.dueDate) : false;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background:  account.isPaid ? '#f8fafc' : '#fff',
        boxShadow:   account.isPaid ? 'none' : '0 2px 16px rgba(0,0,0,0.06)',
        border:      account.isPaid ? '1.5px solid #e2e8f0' : `1.5px solid ${meta.color}22`,
        opacity:     account.isPaid ? 0.7 : 1,
      }}
    >
      {/* Main row */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: account.isPaid ? '#f1f5f9' : meta.bg }}
          >
            {meta.emoji}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p
                  className="text-sm font-black leading-tight truncate"
                  style={{
                    color:           account.isPaid ? '#94a3b8' : '#0f172a',
                    textDecoration:  account.isPaid ? 'line-through' : 'none',
                  }}
                >
                  {account.name}
                </p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: account.isPaid ? '#94a3b8' : meta.color }}>
                  {meta.label}
                </p>
              </div>

              {/* Amount */}
              <p
                className="text-base font-black tabular-nums flex-shrink-0"
                style={{ color: account.isPaid ? '#94a3b8' : meta.color }}
              >
                {formatBRL(account.amount)}
              </p>
            </div>

            {/* Due date */}
            {account.dueDate && (
              <div className="flex items-center gap-1 mt-1.5">
                {overdue
                  ? <AlertCircle size={11} style={{ color: '#dc2626', flexShrink: 0 }} />
                  : <CalendarDays size={11} style={{ color: '#94a3b8', flexShrink: 0 }} />
                }
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: overdue ? '#dc2626' : '#94a3b8' }}
                >
                  {overdue ? 'Vencido em ' : 'Vence em '}{formatDue(account.dueDate)}
                </span>
              </div>
            )}

            {/* Notes */}
            {account.notes && (
              <p className="text-[10px] mt-1 truncate" style={{ color: '#94a3b8' }}>
                {account.notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderTop: '1px solid #f1f5f9' }}
      >
        <button
          onClick={() => onTogglePaid(account.id)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all active:scale-95"
          style={{
            background: account.isPaid ? '#f1f5f9' : meta.bg,
            color:      account.isPaid ? '#94a3b8' : meta.color,
          }}
        >
          <Check size={13} strokeWidth={account.isPaid ? 1.5 : 2.5} />
          {account.isPaid ? 'Pago' : 'Marcar como pago'}
        </button>

        <button
          onClick={() => onEdit(account)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
        >
          <Pencil size={14} style={{ color: '#64748b' }} />
        </button>

        <button
          onClick={() => onDelete(account.id)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: '#fff1f2', border: '1.5px solid #fecdd3' }}
        >
          <Trash2 size={14} style={{ color: '#f43f5e' }} />
        </button>
      </div>
    </div>
  );
}
