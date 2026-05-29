import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { X, Check, Pin, Trash2 } from 'lucide-react';
import { type Note, type NoteColor, NOTE_COLOR_META } from '@/shared/types/note';
import { type NoteFormData } from '../hooks/useNotes';

const COLOR_ORDER: NoteColor[] = ['default', 'yellow', 'green', 'blue', 'pink', 'orange'];

interface NoteModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  onSave:     (data: NoteFormData) => void;
  onDelete?:  (id: string) => void;
  editNote?:  Note | null;
}

function NoteModalContent({ isOpen, onClose, onSave, onDelete, editNote }: NoteModalProps) {
  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');
  const [color,   setColor]   = useState<NoteColor>('default');
  const [pinned,  setPinned]  = useState(false);

  const sheetRef    = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(isOpen);

  if (isOpen && !mounted) setMounted(true);

  useEffect(() => {
    if (!isOpen) return;
    if (editNote) {
      setTitle(editNote.title);
      setContent(editNote.content);
      setColor(editNote.color);
      setPinned(editNote.pinned);
    } else {
      setTitle(''); setContent(''); setColor('default'); setPinned(false);
    }
  }, [isOpen, editNote]);

  useEffect(() => {
    if (!mounted) return;
    const ctx = gsap.context(() => {
      const sheet    = sheetRef.current;
      const backdrop = backdropRef.current;
      if (!sheet || !backdrop) return;
      gsap.set(sheet,    { y: '100%' });
      gsap.set(backdrop, { opacity: 0 });
      gsap.to(sheet,    { y: '0%',   duration: 0.48, ease: 'expo.out'    });
      gsap.to(backdrop, { opacity: 1, duration: 0.28, ease: 'power2.out' });
    });
    return () => ctx.revert();
  }, [mounted]);

  useEffect(() => {
    if (isOpen) return;
    const sheet    = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!sheet) { setMounted(false); return; }
    gsap.to(sheet,    { y: '100%', duration: 0.35, ease: 'power3.in' });
    gsap.to(backdrop, { opacity: 0, duration: 0.28, onComplete: () => setMounted(false) });
  }, [isOpen]);

  if (!mounted) return null;

  const canSave = content.trim().length > 0 || title.trim().length > 0;
  const colors  = NOTE_COLOR_META[color];

  function handleSave() {
    if (!canSave) return;
    onSave({ title: title.trim(), content: content.trim(), color, pinned });
    onClose();
  }

  function handleDelete() {
    if (editNote && onDelete) {
      onDelete(editNote.id);
      onClose();
    }
  }

  return (
    <>
      <div
        ref={backdropRef}
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        className="fixed bottom-0 left-1/2 z-50 flex flex-col rounded-t-3xl overflow-hidden"
        style={{
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: '448px',
          background: colors.bg,
          boxShadow: '0 -8px 48px rgba(0,0,0,0.18)',
          maxHeight: '92svh',
          willChange: 'transform',
          transition: 'background 0.2s ease',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1.5 rounded-full" style={{ background: colors.border }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-2 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Color picker */}
            {COLOR_ORDER.map(c => {
              const m        = NOTE_COLOR_META[c];
              const selected = color === c;
              return (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="transition-transform active:scale-90"
                  style={{
                    width:       selected ? 26 : 22,
                    height:      selected ? 26 : 22,
                    borderRadius: '50%',
                    background:  c === 'default' ? '#e2e8f0' : m.accent,
                    border:      selected ? `3px solid ${m.border}` : '2px solid transparent',
                    outline:     selected ? `2px solid ${m.border}88` : 'none',
                    outlineOffset: '1px',
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            {/* Pin toggle */}
            <button
              onClick={() => setPinned(v => !v)}
              className="flex items-center justify-center rounded-full transition-all active:scale-90"
              style={{
                width: 34, height: 34,
                background: pinned ? colors.border : colors.accent,
              }}
            >
              <Pin size={15} style={{ color: colors.text }} strokeWidth={pinned ? 2.5 : 1.5} />
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-full"
              style={{ width: 34, height: 34, background: colors.accent }}
            >
              <X size={16} style={{ color: colors.text }} />
            </button>
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Title */}
          <input
            type="text"
            placeholder="Título (opcional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full text-lg font-black outline-none bg-transparent mb-2"
            style={{ color: colors.text, fontFamily: 'inherit', caretColor: colors.text }}
          />

          {/* Content */}
          <textarea
            placeholder="Escreva sua anotação aqui..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={8}
            className="w-full text-sm font-medium outline-none bg-transparent resize-none leading-relaxed"
            style={{ color: colors.text + 'cc', fontFamily: 'inherit', caretColor: colors.text }}
            autoFocus={!editNote}
          />
        </div>

        {/* Action bar */}
        <div
          className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          {editNote && onDelete && (
            <button
              onClick={handleDelete}
              className="flex items-center justify-center rounded-xl gap-1.5 px-3 py-2.5 text-xs font-bold transition-all active:scale-95"
              style={{ background: '#fee2e2', color: '#dc2626' }}
            >
              <Trash2 size={14} />
              Excluir
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: canSave ? colors.border : colors.accent,
              color:      colors.text,
            }}
          >
            <Check size={16} strokeWidth={3} />
            {editNote ? 'Salvar' : 'Criar nota'}
          </button>
        </div>
      </div>
    </>
  );
}

export function NoteModal(props: NoteModalProps) {
  return createPortal(<NoteModalContent {...props} />, document.body);
}
