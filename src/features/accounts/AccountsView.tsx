import { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Wallet, TrendingDown, CheckCircle2, Calendar, CalendarDays, Layers } from 'lucide-react';
import { type Account } from '@/shared/types/account';
import { formatBRL } from '@/shared/lib/format';
import {
  useAccountsQuery,
  useAddAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useTogglePaidMutation,
  type NewAccountData,
} from '@/shared/hooks/queries/useAccountsQuery';
import { AccountCard } from './components/AccountCard';
import { AccountModal } from './components/AccountModal';

type StatusFilter = 'all' | 'pending' | 'paid';
type PeriodFilter = 'week' | 'month' | 'all';

// ── Period helpers ────────────────────────────────────────────────────────────

function getWeekRange(): { start: string; end: string; label: string } {
  const today = new Date();
  const dow   = today.getDay(); // 0=Sun
  const diff  = dow === 0 ? -6 : 1 - dow; // Monday-based

  const start = new Date(today);
  start.setDate(today.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(d);

  return {
    start: start.toLocaleDateString('en-CA'),
    end:   end.toLocaleDateString('en-CA'),
    label: `${fmt(start)} – ${fmt(end)}`,
  };
}

function getMonthRange(): { prefix: string; label: string } {
  const today  = new Date();
  const year   = today.getFullYear();
  const month  = String(today.getMonth() + 1).padStart(2, '0');
  const label  = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(today);
  return { prefix: `${year}-${month}`, label };
}

function applyPeriod(accounts: Account[], period: PeriodFilter): Account[] {
  if (period === 'all') return accounts;

  if (period === 'week') {
    const { start, end } = getWeekRange();
    return accounts.filter(a => a.dueDate && a.dueDate >= start && a.dueDate <= end);
  }

  if (period === 'month') {
    const { prefix } = getMonthRange();
    return accounts.filter(a => a.dueDate?.startsWith(prefix));
  }

  return accounts;
}

function applyStatus(accounts: Account[], status: StatusFilter): Account[] {
  if (status === 'pending') return accounts.filter(a => !a.isPaid);
  if (status === 'paid')    return accounts.filter(a =>  a.isPaid);
  return accounts;
}

function sortAccounts(accounts: Account[]): Account[] {
  return [...accounts].sort((a, b) => {
    // Unpaid first
    if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1;
    // Then by dueDate ascending (no date goes last)
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AccountsView() {
  const { data: accounts = [] }  = useAccountsQuery();
  const addMutation              = useAddAccountMutation();
  const updateMutation           = useUpdateAccountMutation();
  const deleteMutation           = useDeleteAccountMutation();
  const togglePaidMutation       = useTogglePaidMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [period, setPeriod]           = useState<PeriodFilter>('month');
  const [status, setStatus]           = useState<StatusFilter>('all');

  const weekRange  = useMemo(getWeekRange,  []);
  const monthRange = useMemo(getMonthRange, []);

  const periodLabel: Record<PeriodFilter, string> = {
    week:  weekRange.label,
    month: monthRange.label,
    all:   'Todas',
  };

  const filtered = useMemo(() => {
    const byPeriod = applyPeriod(accounts, period);
    const byStatus = applyStatus(byPeriod, status);
    return sortAccounts(byStatus);
  }, [accounts, period, status]);

  const totals = useMemo(() => {
    const inView = applyPeriod(accounts, period);
    return {
      totalPending: inView.filter(a => !a.isPaid).reduce((s, a) => s + a.amount, 0),
      totalPaid:    inView.filter(a =>  a.isPaid).reduce((s, a) => s + a.amount, 0),
      countPending: inView.filter(a => !a.isPaid).length,
      countPaid:    inView.filter(a =>  a.isPaid).length,
    };
  }, [accounts, period]);

  const openCreate = useCallback(() => { setEditAccount(null); setIsModalOpen(true); }, []);
  const openEdit   = useCallback((account: Account) => { setEditAccount(account); setIsModalOpen(true); }, []);

  const handleSave = useCallback((data: NewAccountData) => {
    if (editAccount) updateMutation.mutate({ id: editAccount.id, patch: data });
    else             addMutation.mutate(data);
  }, [editAccount, updateMutation, addMutation]);

  const PERIOD_TABS: { id: PeriodFilter; label: string; Icon: typeof Calendar }[] = [
    { id: 'week',  label: 'Semana', Icon: Calendar     },
    { id: 'month', label: 'Mês',    Icon: CalendarDays },
    { id: 'all',   label: 'Todas',  Icon: Layers       },
  ];

  const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
    { id: 'all',     label: `Todas`      },
    { id: 'pending', label: `Pendentes`  },
    { id: 'paid',    label: `Pagas`      },
  ];

  return (
    <div>
      {/* ─── Header ─── */}
      <div
        className="relative px-5 pt-14 pb-6"
        style={{ background: 'linear-gradient(160deg, #581c87, #7c3aed)', borderRadius: '0 0 2rem 2rem' }}
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
          {/* Title + add button */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-purple-300 text-sm font-semibold">Gestão</p>
              <h1 className="text-white text-2xl font-black">Minhas Contas</h1>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 rounded-2xl px-4 py-2.5 font-black text-sm active:scale-95 transition-all"
              style={{
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff',
              }}
            >
              <Plus size={16} strokeWidth={2.8} />
              Nova
            </button>
          </div>

          {/* Period tabs */}
          <div className="flex gap-2 mb-4">
            {PERIOD_TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setPeriod(id)}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black transition-all active:scale-95"
                style={{
                  background: period === id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                  color:      period === id ? '#fff' : 'rgba(255,255,255,0.55)',
                  border:     `1px solid ${period === id ? 'rgba(255,255,255,0.4)' : 'transparent'}`,
                  backdropFilter: 'blur(4px)',
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Period label + summary */}
          <p className="text-purple-300 text-xs font-semibold mb-3 capitalize">
            {periodLabel[period]}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown size={13} className="text-red-300" />
                <p className="text-red-300 text-[10px] font-black uppercase tracking-wider">Em aberto</p>
              </div>
              <p className="text-white text-xl font-black tabular-nums">{formatBRL(totals.totalPending)}</p>
              <p className="text-purple-300 text-[10px] mt-0.5">
                {totals.countPending} conta{totals.countPending !== 1 ? 's' : ''}
              </p>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 size={13} className="text-emerald-300" />
                <p className="text-emerald-300 text-[10px] font-black uppercase tracking-wider">Pagas</p>
              </div>
              <p className="text-white text-xl font-black tabular-nums">{formatBRL(totals.totalPaid)}</p>
              <p className="text-purple-300 text-[10px] mt-0.5">
                {totals.countPaid} conta{totals.countPaid !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Status filter ─── */}
      <div className="px-4 pt-4 pb-1">
        <div className="flex gap-2">
          {STATUS_FILTERS.map(f => {
            const inView  = applyPeriod(accounts, period);
            const count   = f.id === 'all'
              ? inView.length
              : f.id === 'pending'
                ? inView.filter(a => !a.isPaid).length
                : inView.filter(a => a.isPaid).length;
            return (
              <button
                key={f.id}
                onClick={() => setStatus(f.id)}
                className="rounded-full px-4 py-1.5 text-xs font-black transition-all active:scale-95"
                style={{
                  background: status === f.id ? '#7c3aed' : '#f1f5f9',
                  color:      status === f.id ? '#fff'    : '#64748b',
                }}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── List ─── */}
      <div className="px-4 pt-3 space-y-3 pb-8">
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl p-10 flex flex-col items-center gap-3 mt-2"
            style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
          >
            <Wallet size={40} style={{ color: '#cbd5e1' }} />
            <p className="text-sm font-bold text-center" style={{ color: '#94a3b8' }}>
              {period !== 'all'
                ? `Nenhuma conta para ${periodLabel[period].toLowerCase()}.`
                : status === 'pending'
                  ? 'Nenhuma conta pendente. 🎉'
                  : status === 'paid'
                    ? 'Nenhuma conta marcada como paga.'
                    : 'Nenhuma conta cadastrada ainda.'}
            </p>
            {period === 'all' && status === 'all' && (
              <button
                onClick={openCreate}
                className="mt-1 rounded-2xl px-6 py-2.5 text-sm font-black active:scale-95 transition-all"
                style={{ background: '#7c3aed', color: '#fff' }}
              >
                Adicionar conta
              </button>
            )}
          </div>
        ) : (
          filtered.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              onTogglePaid={(id) => togglePaidMutation.mutate({ id, isPaid: !account.isPaid })}
              onEdit={openEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))
        )}
      </div>

      {createPortal(
        <AccountModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          editAccount={editAccount}
        />,
        document.body
      )}
    </div>
  );
}
