import { supabase } from '@/config/supabase';
import { type Note, type NoteColor } from '@/shared/types/note';

type NoteRow = {
  id:         string;
  title:      string;
  content:    string;
  color:      string;
  pinned:     boolean;
  created_at: string;
  updated_at: string;
};

const SELECT_COLS = 'id, title, content, color, pinned, created_at, updated_at';

function rowToNote(row: NoteRow): Note {
  return {
    id:        row.id,
    title:     row.title,
    content:   row.content,
    color:     row.color     as NoteColor,
    pinned:    row.pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select(SELECT_COLS)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToNote);
}

export async function insertNote(note: Note): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      id:      note.id,
      title:   note.title,
      content: note.content,
      color:   note.color,
      pinned:  note.pinned,
    })
    .select(SELECT_COLS)
    .single();

  if (error) throw error;
  return rowToNote(data);
}

export async function patchNote(
  id: string,
  patch: Partial<Pick<Note, 'title' | 'content' | 'color' | 'pinned'>>
): Promise<void> {
  const { error } = await supabase.from('notes').update(patch).eq('id', id);
  if (error) throw error;
}

export async function removeNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}
