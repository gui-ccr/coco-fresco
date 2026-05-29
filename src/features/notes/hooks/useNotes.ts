import { useState, useEffect, useCallback } from 'react';
import { type Note, type NoteColor } from '@/shared/types/note';
import { fetchNotes, insertNote, patchNote, removeNote } from '@/shared/services/noteService';

const STORAGE_KEY = 'coco_notes_v1';

const IS_CONFIGURED =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

function loadFromStorage(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
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

export interface NoteFormData {
  title:   string;
  content: string;
  color:   NoteColor;
  pinned:  boolean;
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(loadFromStorage);

  function commit(updated: Note[]) {
    const sorted = sortNotes(updated);
    setNotes(sorted);
    saveToStorage(sorted);
  }

  // ── On mount: sync with Supabase ──────────────────────────────────────
  useEffect(() => {
    if (!IS_CONFIGURED) return;

    const local = loadFromStorage();

    fetchNotes()
      .then(remote => {
        const remoteIds = new Set(remote.map(n => n.id));
        const unsynced  = local.filter(n => !remoteIds.has(n.id));

        if (unsynced.length > 0) {
          Promise.all(unsynced.map(n => insertNote(n))).catch(err =>
            console.error('Notes: falha ao sincronizar registros locais:', err)
          );
        }

        const merged = sortNotes([...remote, ...unsynced]);
        setNotes(merged);
        saveToStorage(merged);
      })
      .catch(err => console.error('Notes: falha ao buscar do Supabase:', err));
  }, []);

  // ── Add ───────────────────────────────────────────────────────────────
  const addNote = useCallback((data: NoteFormData) => {
    const now  = new Date().toISOString();
    const note: Note = {
      id:        crypto.randomUUID(),
      title:     data.title,
      content:   data.content,
      color:     data.color,
      pinned:    data.pinned,
      createdAt: now,
      updatedAt: now,
    };

    commit([note, ...notes]);

    if (IS_CONFIGURED) {
      insertNote(note).catch(err =>
        console.error('Notes: falha ao inserir no Supabase:', err)
      );
    }
  }, [notes]);

  // ── Update ────────────────────────────────────────────────────────────
  const updateNote = useCallback((id: string, data: NoteFormData) => {
    const updatedAt = new Date().toISOString();
    commit(notes.map(n =>
      n.id === id ? { ...n, ...data, updatedAt } : n
    ));

    if (IS_CONFIGURED) {
      patchNote(id, data).catch(err =>
        console.error('Notes: falha ao atualizar no Supabase:', err)
      );
    }
  }, [notes]);

  // ── Delete ────────────────────────────────────────────────────────────
  const deleteNote = useCallback((id: string) => {
    commit(notes.filter(n => n.id !== id));

    if (IS_CONFIGURED) {
      removeNote(id).catch(err =>
        console.error('Notes: falha ao deletar no Supabase:', err)
      );
    }
  }, [notes]);

  // ── Toggle pin ────────────────────────────────────────────────────────
  const togglePin = useCallback((id: string) => {
    const target = notes.find(n => n.id === id);
    if (!target) return;

    const pinned = !target.pinned;
    commit(notes.map(n => (n.id === id ? { ...n, pinned } : n)));

    if (IS_CONFIGURED) {
      patchNote(id, { pinned }).catch(err =>
        console.error('Notes: falha ao atualizar pin no Supabase:', err)
      );
    }
  }, [notes]);

  return { notes, addNote, updateNote, deleteNote, togglePin };
}
