import { api } from '@/config/axios';
import type { Account, AccountType, Recurrence } from '@/shared/types/account';

type AccountRow = {
  id:         string;
  name:       string;
  type:       string;
  amount:     number;
  due_date:   string | null;
  notes:      string | null;
  is_paid:    boolean;
  recurrence: string;
  group_id:   string | null;
  created_at: string;
};

const SELECT_COLS = 'id,name,type,amount,due_date,notes,is_paid,recurrence,group_id,created_at';

function rowToAccount(row: AccountRow): Account {
  return {
    id:         row.id,
    name:       row.name,
    type:       row.type       as AccountType,
    amount:     Number(row.amount),
    dueDate:    row.due_date   ?? undefined,
    notes:      row.notes      ?? undefined,
    isPaid:     row.is_paid,
    recurrence: row.recurrence as Recurrence,
    groupId:    row.group_id   ?? undefined,
    createdAt:  row.created_at,
  };
}

function accountToRow(a: Account) {
  return {
    id:         a.id,
    name:       a.name,
    type:       a.type,
    amount:     a.amount,
    due_date:   a.dueDate   ?? null,
    notes:      a.notes     ?? null,
    is_paid:    a.isPaid,
    recurrence: a.recurrence,
    group_id:   a.groupId   ?? null,
  };
}

export async function fetchAccounts(): Promise<Account[]> {
  const { data } = await api.get<AccountRow[]>('/accounts', {
    params: { select: SELECT_COLS, order: 'created_at.desc' },
  });
  return data.map(rowToAccount);
}

export async function insertAccounts(accounts: Account[]): Promise<Account[]> {
  const { data } = await api.post<AccountRow[]>('/accounts', accounts.map(accountToRow));
  return data.map(rowToAccount);
}

export async function patchAccount(
  id: string,
  patch: Partial<{
    name:       string;
    type:       AccountType;
    amount:     number;
    dueDate:    string | undefined;
    notes:      string | undefined;
    isPaid:     boolean;
    recurrence: Recurrence;
  }>
): Promise<void> {
  const row: Record<string, unknown> = {};
  if ('name'       in patch) row.name       = patch.name;
  if ('type'       in patch) row.type       = patch.type;
  if ('amount'     in patch) row.amount     = patch.amount;
  if ('dueDate'    in patch) row.due_date   = patch.dueDate ?? null;
  if ('notes'      in patch) row.notes      = patch.notes  ?? null;
  if ('isPaid'     in patch) row.is_paid    = patch.isPaid;
  if ('recurrence' in patch) row.recurrence = patch.recurrence;

  await api.patch('/accounts', row, { params: { id: `eq.${id}` } });
}

export async function removeAccount(id: string): Promise<void> {
  await api.delete('/accounts', { params: { id: `eq.${id}` } });
}
