import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IS_CONFIGURED } from '@/config/axios';
import { fetchAccounts, insertAccounts, patchAccount, removeAccount } from '@/shared/services/accountService';
import { type Account, type AccountType, type Recurrence, generateRecurringDates } from '@/shared/types/account';

const STORAGE_KEY = 'coco_accounts_v1';

export interface NewAccountData {
  name:        string;
  type:        AccountType;
  amount:      number;
  dueDate?:    string;
  notes?:      string;
  recurrence:  Recurrence;
  occurrences: number;
}

function loadFromStorage(): Account[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Account[]) : [];
  } catch { return []; }
}

function saveToStorage(accounts: Account[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

function sortByCreated(accounts: Account[]): Account[] {
  return [...accounts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function buildAccounts(data: NewAccountData): Account[] {
  const isRecurring = data.recurrence !== 'none' && !!data.dueDate;
  const groupId     = isRecurring ? crypto.randomUUID() : undefined;
  const count       = isRecurring ? data.occurrences : 1;

  const dates = isRecurring && data.dueDate
    ? generateRecurringDates(data.dueDate, data.recurrence, count)
    : [data.dueDate];

  return dates.map(dueDate => ({
    id:         crypto.randomUUID(),
    name:       data.name,
    type:       data.type,
    amount:     data.amount,
    notes:      data.notes,
    recurrence: data.recurrence,
    groupId,
    dueDate,
    isPaid:     false,
    createdAt:  new Date().toISOString(),
  }));
}

export const ACCOUNTS_KEY = ['accounts'] as const;

export function useAccountsQuery() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn:  async () => {
      const remote    = await fetchAccounts();
      const local     = loadFromStorage();
      const remoteIds = new Set(remote.map(a => a.id));
      const unsynced  = local.filter(a => !remoteIds.has(a.id));

      if (unsynced.length > 0) {
        insertAccounts(unsynced).catch(console.error);
      }

      const merged = sortByCreated([...remote, ...unsynced]);
      saveToStorage(merged);
      return merged;
    },
    enabled:     IS_CONFIGURED,
    initialData: () => sortByCreated(loadFromStorage()),
  });
}

export function useAddAccountMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: NewAccountData) => insertAccounts(buildAccounts(data)),

    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ACCOUNTS_KEY });
      const previous  = qc.getQueryData<Account[]>(ACCOUNTS_KEY) ?? [];
      const optimistic = buildAccounts(data);
      const updated    = sortByCreated([...optimistic, ...previous]);
      qc.setQueryData(ACCOUNTS_KEY, updated);
      saveToStorage(updated);
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData(ACCOUNTS_KEY, ctx?.previous);
      saveToStorage(ctx?.previous ?? []);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useUpdateAccountMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: {
      id:    string;
      patch: Partial<Omit<NewAccountData, 'occurrences'>>;
    }) => patchAccount(id, patch),

    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ACCOUNTS_KEY });
      const previous = qc.getQueryData<Account[]>(ACCOUNTS_KEY) ?? [];
      const updated  = previous.map(a => a.id === id ? { ...a, ...patch } : a);
      qc.setQueryData(ACCOUNTS_KEY, updated);
      saveToStorage(updated);
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData(ACCOUNTS_KEY, ctx?.previous);
      saveToStorage(ctx?.previous ?? []);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useDeleteAccountMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: removeAccount,

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ACCOUNTS_KEY });
      const previous = qc.getQueryData<Account[]>(ACCOUNTS_KEY) ?? [];
      const updated  = previous.filter(a => a.id !== id);
      qc.setQueryData(ACCOUNTS_KEY, updated);
      saveToStorage(updated);
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData(ACCOUNTS_KEY, ctx?.previous);
      saveToStorage(ctx?.previous ?? []);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useTogglePaidMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isPaid }: { id: string; isPaid: boolean }) =>
      patchAccount(id, { isPaid }),

    onMutate: async ({ id, isPaid }) => {
      await qc.cancelQueries({ queryKey: ACCOUNTS_KEY });
      const previous = qc.getQueryData<Account[]>(ACCOUNTS_KEY) ?? [];
      const updated  = previous.map(a => a.id === id ? { ...a, isPaid } : a);
      qc.setQueryData(ACCOUNTS_KEY, updated);
      saveToStorage(updated);
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData(ACCOUNTS_KEY, ctx?.previous);
      saveToStorage(ctx?.previous ?? []);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}
