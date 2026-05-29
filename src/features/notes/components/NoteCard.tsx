import { Pin } from 'lucide-react';
import { type Note, NOTE_COLOR_META } from '@/shared/types/note';

interface NoteCardProps {
  note:    Note;
  onOpen:  (note: Note) => void;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    .format(new Date(iso));
}

export function NoteCard({ note, onOpen }: NoteCardProps) {
  const colors = NOTE_COLOR_META[note.color];

  return (
    <button
      onClick={() => onOpen(note)}
      className="w-full text-left rounded-2xl overflow-hidden active:scale-[0.97] transition-transform duration-100"
      style={{
        background: colors.bg,
        border:     `1.5px solid ${colors.border}`,
        boxShadow:  '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Color accent bar */}
      <div className="h-1.5 w-full" style={{ background: colors.accent }} />

      <div className="p-3">
        {/* Top row: title + pin */}
        <div className="flex items-start justify-between gap-1 mb-1.5">
          {note.title ? (
            <p
              className="text-sm font-black leading-tight line-clamp-2 flex-1"
              style={{ color: colors.text }}
            >
              {note.title}
            </p>
          ) : (
            <div className="flex-1" />
          )}
          {note.pinned && (
            <Pin size={12} style={{ color: colors.border, flexShrink: 0, marginTop: 1 }} />
          )}
        </div>

        {/* Content preview */}
        {note.content && (
          <p
            className="text-xs leading-relaxed line-clamp-4"
            style={{ color: colors.text + 'bb' }}
          >
            {note.content}
          </p>
        )}

        {/* Date */}
        <p className="text-[9px] font-semibold mt-2" style={{ color: colors.text + '77' }}>
          {formatDate(note.updatedAt)}
        </p>
      </div>
    </button>
  );
}
