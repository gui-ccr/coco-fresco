export type AccountType =
  | 'credit_card'
  | 'loan'
  | 'installment'
  | 'subscription'
  | 'bill'
  | 'other';

export type Recurrence = 'none' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface Account {
  id:          string;
  name:        string;
  type:        AccountType;
  amount:      number;
  dueDate?:    string;      // YYYY-MM-DD
  notes?:      string;
  isPaid:      boolean;
  recurrence:  Recurrence;
  groupId?:    string;      // links recurring entries
  createdAt:   string;
}

export const ACCOUNT_TYPE_META: Record<AccountType, {
  label: string;
  emoji: string;
  color: string;
  bg:    string;
}> = {
  credit_card:  { label: 'Cartão de Crédito', emoji: '💳', color: '#7c3aed', bg: '#ede9fe' },
  loan:         { label: 'Empréstimo',         emoji: '🏦', color: '#dc2626', bg: '#fee2e2' },
  installment:  { label: 'Parcelamento',       emoji: '📦', color: '#ea580c', bg: '#ffedd5' },
  subscription: { label: 'Assinatura',         emoji: '📱', color: '#0284c7', bg: '#e0f2fe' },
  bill:         { label: 'Conta Fixa',         emoji: '📄', color: '#059669', bg: '#d1fae5' },
  other:        { label: 'Outro',              emoji: '💰', color: '#64748b', bg: '#f1f5f9' },
};

export const RECURRENCE_META: Record<Recurrence, { label: string; short: string }> = {
  none:     { label: 'Não repetir', short: 'Única'  },
  weekly:   { label: 'Semanal',     short: 'Sem.'   },
  biweekly: { label: 'Quinzenal',   short: 'Quin.'  },
  monthly:  { label: 'Mensal',      short: 'Mens.'  },
  yearly:   { label: 'Anual',       short: 'Anual'  },
};

export function nextDueDate(from: string, recurrence: Recurrence): string {
  const d = new Date(from + 'T12:00:00');
  if (recurrence === 'weekly')   d.setDate(d.getDate() + 7);
  if (recurrence === 'biweekly') d.setDate(d.getDate() + 14);
  if (recurrence === 'monthly')  d.setMonth(d.getMonth() + 1);
  if (recurrence === 'yearly')   d.setFullYear(d.getFullYear() + 1);
  return d.toLocaleDateString('en-CA');
}

export function generateRecurringDates(startDate: string, recurrence: Recurrence, count: number): string[] {
  const dates: string[] = [startDate];
  for (let i = 1; i < count; i++) {
    dates.push(nextDueDate(dates[dates.length - 1], recurrence));
  }
  return dates;
}
