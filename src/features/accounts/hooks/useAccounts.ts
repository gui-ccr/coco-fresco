import { useState, useEffect, useCallback } from 'react';
import { type Account, type AccountType, type Recurrence, generateRecurringDates } from '@/shared/types/account';
import {
  fetchAccounts,
  insertAccounts,
  patchAccount,
  removeAccount,
} from '@/shared/services/accountService';

const STORAGE_KEY = 'coco_accounts_v1';

const IS_CONFIGURED =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

function loadFromStorage(): Account[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Account[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(accounts: Account[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

function sortByCreated(accounts: Account[]): Account[] {
  return [...accounts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export interface NewAccountData {
  name:        string;
  type:        AccountType;
  amount:      number;
  dueDate?:    string;
  notes?:      string;
  recurrence:  Recurrence;
  occurrences: number;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>(loadFromStorage);

  function commit(updated: Account[]) {
    const sorted = sortByCreated(updated);
    setAccounts(sorted);
    saveToStorage(sorted);
  }

  // ── On mount: sync with Supabase ────────────────────────────────────────
  useEffect(() => {
    if (!IS_CONFIGURED) return;

    const local = loadFromStorage();

    fetchAccounts()
      .then(remote => {
        const remoteIds = new Set(remote.map(a => a.id));
        const unsynced  = local.filter(a => !remoteIds.has(a.id));

        // Push any records created locally while offline
        if (unsynced.length > 0) {
          insertAccounts(unsynced).catch(err =>
            console.error('Accounts: falha ao sincronizar registros locais:', err)
          );
        }

        const merged = sortByCreated([...remote, ...unsynced]);
        setAccounts(merged);
        saveToStorage(merged);
      })
      .catch(err => console.error('Accounts: falha ao buscar do Supabase:', err));
  }, []);

  // ── Add (supports recurrence batch) ────────────────────────────────────
  const addAccount = useCallback((data: NewAccountData) => {
    const isRecurring = data.recurrence !== 'none' && !!data.dueDate;
    const groupId     = isRecurring ? crypto.randomUUID() : undefined;
    const count       = isRecurring ? data.occurrences : 1;

    const dates = isRecurring && data.dueDate
      ? generateRecurringDates(data.dueDate, data.recurrence, count)
      : [data.dueDate];

    const newAccounts: Account[] = dates.map(dueDate => ({
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

    // Optimistic update
    commit([...newAccounts, ...accounts]);

    // Sync to Supabase
    if (IS_CONFIGURED) {
      insertAccounts(newAccounts).catch(err =>
        console.error('Accounts: falha ao inserir no Supabase:', err)
      );
    }
  }, [accounts]);

  // ── Update ──────────────────────────────────────────────────────────────
  const updateAccount = useCallback((
    id: string,
    data: Partial<Omit<NewAccountData, 'occurrences'>>
  ) => {
    const updated = accounts.map(a => (a.id === id ? { ...a, ...data } : a));
    commit(updated);

    if (IS_CONFIGURED) {
      patchAccount(id, data).catch(err =>
        console.error('Accounts: falha ao atualizar no Supabase:', err)
      );
    }
  }, [accounts]);

  // ── Delete ──────────────────────────────────────────────────────────────
  const deleteAccount = useCallback((id: string) => {
    commit(accounts.filter(a => a.id !== id));

    if (IS_CONFIGURED) {
      removeAccount(id).catch(err =>
        console.error('Accounts: falha ao deletar no Supabase:', err)
      );
    }
  }, [accounts]);

  // ── Toggle paid ─────────────────────────────────────────────────────────
  const togglePaid = useCallback((id: string) => {
    const target  = accounts.find(a => a.id === id);
    if (!target) return;

    const newPaid = !target.isPaid;
    commit(accounts.map(a => (a.id === id ? { ...a, isPaid: newPaid } : a)));

    if (IS_CONFIGURED) {
      patchAccount(id, { isPaid: newPaid }).catch(err =>
        console.error('Accounts: falha ao atualizar status no Supabase:', err)
      );
    }
  }, [accounts]);

  return { accounts, addAccount, updateAccount, deleteAccount, togglePaid };
}
