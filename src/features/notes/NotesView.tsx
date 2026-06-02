import { useState, useCallback } from 'react';
import { Plus, StickyNote } from 'lucide-react';
import { type Note } from '@/shared/types/note';
import { useNotes } from './hooks/useNotes';
import { NoteCard } from './components/NoteCard';
import { NoteModal } from './components/NoteModal';

export function NotesView() {
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editNote, setEditNote]       = useState<Note | null>(null);

  const pinned   = notes.filter(n =>  n.pinned);
  const unpinned = notes.filter(n => !n.pinned);

  const openCreate = useCallback(() => { setEditNote(null); setIsModalOpen(true); }, []);
  const openEdit   = useCallback((note: Note) => { setEditNote(note); setIsModalOpen(true); }, []);

  return (
    <div>
      {/* ─── Header ─── */}
      <div
        className="relative px-5 pt-14 pb-8"
        style={{ background: 'linear-gradient(160deg, #92400e, #d97706)', borderRadius: '0 0 2rem 2rem' }}
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-300 text-sm font-semibold mb-1">Suas anotações</p>
              <h1 className="text-white text-2xl font-black">Notas</h1>
              <p className="text-amber-300 text-xs mt-1">
                {notes.length === 0
                  ? 'Nenhuma nota ainda'
                  : `${notes.length} nota${notes.length !== 1 ? 's' : ''}${pinned.length > 0 ? ` · ${pinned.length} fixada${pinned.length !== 1 ? 's' : ''}` : ''}`}
              </p>
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
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="px-4 pt-5 pb-8">
        {notes.length === 0 ? (
          <div
            className="rounded-2xl p-10 flex flex-col items-center gap-4"
            style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: '#fef3c7' }}
            >
              <StickyNote size={32} style={{ color: '#d97706' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-black" style={{ color: '#0f172a' }}>Nenhuma nota ainda</p>
              <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                Toque em "+ Nova" para criar sua primeira anotação
              </p>
            </div>
            <button
              onClick={openCreate}
              className="rounded-2xl px-6 py-2.5 text-sm font-black active:scale-95 transition-all"
              style={{ background: '#d97706', color: '#fff' }}
            >
              Criar nota
            </button>
          </div>
        ) : (
          <>
            {/* Pinned section */}
            {pinned.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] font-black tracking-widest uppercase mb-3 px-1" style={{ color: '#94a3b8' }}>
                  📌 Fixadas
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {pinned.map(note => (
                    <NoteCard key={note.id} note={note} onOpen={openEdit} />
                  ))}
                </div>
              </div>
            )}

            {/* Other notes */}
            {unpinned.length > 0 && (
              <div>
                {pinned.length > 0 && (
                  <p className="text-[10px] font-black tracking-widest uppercase mb-3 px-1" style={{ color: '#94a3b8' }}>
                    Outras
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {unpinned.map(note => (
                    <NoteCard key={note.id} note={note} onOpen={openEdit} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={data => editNote ? updateNote(editNote.id, data) : addNote(data)}
        onDelete={deleteNote}
        editNote={editNote}
      />
    </div>
  );
}
