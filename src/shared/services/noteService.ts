import { api } from '@/config/axios';
import type { Note, NoteColor } from '@/shared/types/note';

type NoteRow = {
  id:         string;
  title:      string;
  content:    string;
  color:      string;
  pinned:     boolean;
  created_at: string;
  updated_at: string;
};

const SELECT_COLS = 'id,title,content,color,pinned,created_at,updated_at';

function rowToNote(row: NoteRow): Note {
  return {
    id:        row.id,
    title:     row.title,
    content:   row.content,
    color:     row.color  as NoteColor,
    pinned:    row.pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchNotes(): Promise<Note[]> {
  const { data } = await api.get<NoteRow[]>('/notes', {
    params: { select: SELECT_COLS, order: 'updated_at.desc' },
  });
  return data.map(rowToNote);
}

export async function insertNote(note: Note): Promise<Note> {
  const { data } = await api.post<NoteRow[]>('/notes', {
    id:      note.id,
    title:   note.title,
    content: note.content,
    color:   note.color,
    pinned:  note.pinned,
  });
  return rowToNote(data[0]);
}

export async function patchNote(
  id: string,
  patch: Partial<Pick<Note, 'title' | 'content' | 'color' | 'pinned'>>
): Promise<void> {
  await api.patch('/notes', patch, { params: { id: `eq.${id}` } });
}

export async function removeNote(id: string): Promise<void> {
  await api.delete('/notes', { params: { id: `eq.${id}` } });
}
