import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IS_CONFIGURED } from '@/config/axios';
import { fetchNotes, insertNote, patchNote, removeNote } from '@/shared/services/noteService';
import { type Note, type NoteColor } from '@/shared/types/note';

const STORAGE_KEY = 'coco_notes_v1';

export interface NoteFormData {
  title:   string;
  content: string;
  color:   NoteColor;
  pinned:  boolean;
}

function loadFromStorage(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch { return []; }
}

function saveToStorage(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export const NOTES_KEY = ['notes'] as const;

export function useNotesQuery() {
  return useQuery({
    queryKey: NOTES_KEY,
    queryFn:  async () => {
      const remote    = await fetchNotes();
      const local     = loadFromStorage();
      const remoteIds = new Set(remote.map(n => n.id));
      const unsynced  = local.filter(n => !remoteIds.has(n.id));

      if (unsynced.length > 0) {
        Promise.all(unsynced.map(n => insertNote(n))).catch(console.error);
      }

      const merged = sortNotes([...remote, ...unsynced]);
      saveToStorage(merged);
      return merged;
    },
    enabled:              IS_CONFIGURED,
    initialData:          () => sortNotes(loadFromStorage()),
    initialDataUpdatedAt: 0,
  });
}

export function useAddNoteMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: NoteFormData) => {
      const now  = new Date().toISOString();
      const note: Note = {
        id:        crypto.randomUUID(),
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      return insertNote(note);
    },

    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: NOTES_KEY });
      const previous = qc.getQueryData<Note[]>(NOTES_KEY) ?? [];
      const now = new Date().toISOString();
      const optimistic: Note = {
        id: `temp-${Date.now()}`, ...data, createdAt: now, updatedAt: now,
      };
      const updated = sortNotes([optimistic, ...previous]);
      qc.setQueryData(NOTES_KEY, updated);
      saveToStorage(updated);
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData(NOTES_KEY, ctx?.previous);
      saveToStorage(ctx?.previous ?? []);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: NOTES_KEY });
    },
  });
}

export function useUpdateNoteMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NoteFormData }) =>
      patchNote(id, data),

    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: NOTES_KEY });
      const previous  = qc.getQueryData<Note[]>(NOTES_KEY) ?? [];
      const updatedAt = new Date().toISOString();
      const updated   = sortNotes(previous.map(n =>
        n.id === id ? { ...n, ...data, updatedAt } : n
      ));
      qc.setQueryData(NOTES_KEY, updated);
      saveToStorage(updated);
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData(NOTES_KEY, ctx?.previous);
      saveToStorage(ctx?.previous ?? []);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: NOTES_KEY });
    },
  });
}

export function useDeleteNoteMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: removeNote,

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: NOTES_KEY });
      const previous = qc.getQueryData<Note[]>(NOTES_KEY) ?? [];
      const updated  = sortNotes(previous.filter(n => n.id !== id));
      qc.setQueryData(NOTES_KEY, updated);
      saveToStorage(updated);
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData(NOTES_KEY, ctx?.previous);
      saveToStorage(ctx?.previous ?? []);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: NOTES_KEY });
    },
  });
}

export function useTogglePinMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      patchNote(id, { pinned }),

    onMutate: async ({ id, pinned }) => {
      await qc.cancelQueries({ queryKey: NOTES_KEY });
      const previous = qc.getQueryData<Note[]>(NOTES_KEY) ?? [];
      const updated  = sortNotes(previous.map(n => n.id === id ? { ...n, pinned } : n));
      qc.setQueryData(NOTES_KEY, updated);
      saveToStorage(updated);
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      qc.setQueryData(NOTES_KEY, ctx?.previous);
      saveToStorage(ctx?.previous ?? []);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: NOTES_KEY });
    },
  });
}
