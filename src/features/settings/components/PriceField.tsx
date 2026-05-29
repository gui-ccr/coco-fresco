import { useState } from 'react';
import { Check } from 'lucide-react';
import { type FieldConfig } from '../constants/priceFields';
import { formatBRL } from '@/shared/lib/format';

interface PriceFieldProps {
  field:    FieldConfig;
  value:    number;
  onChange: (v: number) => void;
}

export function PriceField({ field, value, onChange }: PriceFieldProps) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw]         = useState('');

  function startEdit() {
    setRaw(value > 0 ? value.toFixed(2).replace('.', ',') : '');
    setEditing(true);
  }

  function commitEdit() {
    const parsed = parseFloat(raw.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) onChange(parsed);
    setEditing(false);
  }

  return (
    <div
      className="flex items-center gap-3 py-3.5"
      style={{ borderBottom: '1px solid #f1f5f9' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: '#f8fafc' }}
      >
        {field.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{field.label}</p>
        <p className="text-[10px]" style={{ color: '#94a3b8' }}>{field.description}</p>
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: '#64748b' }}>R$</span>
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            value={raw}
            onChange={e => setRaw(e.target.value.replace(/[^0-9,]/g, ''))}
            onBlur={commitEdit}
            onKeyDown={e => e.key === 'Enter' && commitEdit()}
            className="w-20 text-right rounded-xl px-2 py-1.5 text-sm font-black outline-none"
            style={{
              background: '#f0fdf4',
              border: '2px solid #059669',
              color: '#059669',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={commitEdit}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: '#059669' }}
          >
            <Check size={14} className="text-white" />
          </button>
        </div>
      ) : (
        <button
          onClick={startEdit}
          className="rounded-xl px-3 py-1.5 text-sm font-black tabular-nums transition-colors active:scale-95"
          style={{
            background: value > 0 ? '#d1fae5' : '#fee2e2',
            color:      value > 0 ? '#059669' : '#dc2626',
          }}
        >
          {value > 0 ? formatBRL(value) : 'Configurar'}
        </button>
      )}
    </div>
  );
}
