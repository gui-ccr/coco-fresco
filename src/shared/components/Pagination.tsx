import { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page:     number;
  total:    number;
  pageSize: number;
  onChange: (p: number) => void;
}

export const Pagination = memo(function Pagination({ page, total, pageSize, onChange }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 pt-3 pb-1">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="flex items-center justify-center rounded-xl active:scale-90 transition-all duration-75 disabled:opacity-30"
        style={{ width: 36, height: 36, background: '#f1f5f9' }}
      >
        <ChevronLeft size={18} style={{ color: '#475569' }} />
      </button>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className="rounded-full transition-all duration-100"
            style={{
              width:      i === page ? 20 : 8,
              height:     8,
              background: i === page ? '#059669' : '#cbd5e1',
            }}
          />
        ))}
      </div>

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="flex items-center justify-center rounded-xl active:scale-90 transition-all duration-75 disabled:opacity-30"
        style={{ width: 36, height: 36, background: '#f1f5f9' }}
      >
        <ChevronRight size={18} style={{ color: '#475569' }} />
      </button>
    </div>
  );
});
