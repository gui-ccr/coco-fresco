import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { X, Check, RefreshCw, Minus, Plus } from 'lucide-react';
import {
  type Account, type AccountType, type Recurrence,
  ACCOUNT_TYPE_META, RECURRENCE_META, generateRecurringDates,
} from '@/shared/types/account';
import { type NewAccountData } from '../hooks/useAccounts';
import { formatBRL } from '@/shared/lib/format';

const TYPE_ORDER: AccountType[]   = ['credit_card', 'loan', 'installment', 'subscription', 'bill', 'other'];
const RECURRENCE_ORDER: Recurrence[] = ['none', 'weekly', 'biweekly', 'monthly', 'yearly'];

interface FormState {
  name:        string;
  type:        AccountType;
  amount:      string;
  dueDate:     string;
  notes:       string;
  recurrence:  Recurrence;
  occurrences: number;
}

const EMPTY_FORM: FormState = {
  name:        '',
  type:        'credit_card',
  amount:      '',
  dueDate:     '',
  notes:       '',
  recurrence:  'none',
  occurrences: 3,
};

function formatPreviewDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    .format(new Date(dateStr + 'T12:00:00'));
}

interface AccountModalProps {
  isOpen:       boolean;
  onClose:      () => void;
  onSave:       (data: NewAccountData) => void;
  editAccount?: Account | null;
}

export function AccountModal({ isOpen, onClose, onSave, editAccount }: AccountModalProps) {
  const [mounted, setMounted] = useState(isOpen);
  const [form, setForm]       = useState<FormState>(EMPTY_FORM);

  const sheetRef    = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  if (isOpen && !mounted) setMounted(true);

  useEffect(() => {
    if (!isOpen) return;
    if (editAccount) {
      setForm({
        name:        editAccount.name,
        type:        editAccount.type,
        amount:      editAccount.amount.toFixed(2).replace('.', ','),
        dueDate:     editAccount.dueDate ?? '',
        notes:       editAccount.notes ?? '',
        recurrence:  editAccount.recurrence ?? 'none',
        occurrences: 3,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [isOpen, editAccount]);

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

  const amountValue   = parseFloat(form.amount.replace(',', '.')) || 0;
  const isRecurring   = form.recurrence !== 'none';
  const needsDate     = isRecurring;
  const canSave       = form.name.trim().length > 0
    && amountValue > 0
    && (!needsDate || form.dueDate !== '');

  const previewDates  = isRecurring && form.dueDate
    ? generateRecurringDates(form.dueDate, form.recurrence, form.occurrences)
    : [];

  function handleSave() {
    if (!canSave) return;
    onSave({
      name:        form.name.trim(),
      type:        form.type,
      amount:      amountValue,
      dueDate:     form.dueDate || undefined,
      notes:       form.notes.trim() || undefined,
      recurrence:  form.recurrence,
      occurrences: form.occurrences,
    });
    onClose();
  }

  function setOccurrences(delta: number) {
    setForm(f => ({ ...f, occurrences: Math.min(24, Math.max(2, f.occurrences + delta)) }));
  }

  const meta = ACCOUNT_TYPE_META[form.type];

  return (
    <>
      <div
        ref={backdropRef}
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        className="fixed bottom-0 left-1/2 z-50 flex flex-col rounded-t-3xl overflow-hidden"
        style={{
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: '448px',
          background: '#ffffff',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.18)',
          maxHeight: '92svh',
          willChange: 'transform',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1.5 rounded-full" style={{ background: '#e2e8f0' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#94a3b8' }}>
              {editAccount ? 'Editar conta' : 'Nova conta'}
            </p>
            <p className="text-base font-black mt-0.5" style={{ color: '#0f172a' }}>
              {editAccount ? editAccount.name : 'Adicionar conta ou dívida'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36, background: '#f1f5f9' }}
          >
            <X size={17} style={{ color: '#64748b' }} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-5">

          {/* Name */}
          <div>
            <label className="text-[10px] font-black tracking-widest uppercase mb-1.5 block" style={{ color: '#94a3b8' }}>
              Nome da conta
            </label>
            <input
              type="text"
              placeholder="Ex: Cartão Nubank, Empréstimo banco..."
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none"
              style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#0f172a', fontFamily: 'inherit' }}
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-[10px] font-black tracking-widest uppercase mb-1.5 block" style={{ color: '#94a3b8' }}>
              Tipo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_ORDER.map(t => {
                const m        = ACCOUNT_TYPE_META[t];
                const selected = form.type === t;
                return (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className="flex flex-col items-center gap-1 rounded-2xl py-3 px-2 transition-all active:scale-95"
                    style={{
                      background: selected ? m.bg : '#f8fafc',
                      border:     `2px solid ${selected ? m.color : '#e2e8f0'}`,
                    }}
                  >
                    <span className="text-xl leading-none">{m.emoji}</span>
                    <span className="text-[9px] font-black text-center leading-tight" style={{ color: selected ? m.color : '#94a3b8' }}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-[10px] font-black tracking-widest uppercase mb-1.5 block" style={{ color: '#94a3b8' }}>
              Valor
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#64748b' }}>R$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={form.amount}
                onChange={e => {
                  const v = e.target.value.replace(/[^0-9,]/g, '');
                  const parts = v.split(',');
                  if (parts.length > 2 || parts[1]?.length > 2) return;
                  setForm(f => ({ ...f, amount: v }));
                }}
                className="w-full rounded-2xl py-3.5 pr-4 text-sm font-black tabular-nums outline-none text-right"
                style={{
                  paddingLeft: '2.5rem',
                  background: amountValue > 0 ? meta.bg : '#f8fafc',
                  border: `1.5px solid ${amountValue > 0 ? meta.color + '66' : '#e2e8f0'}`,
                  color: amountValue > 0 ? meta.color : '#94a3b8',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            {amountValue > 0 && (
              <p className="text-xs mt-1 text-right font-semibold" style={{ color: meta.color }}>
                {formatBRL(amountValue)}
              </p>
            )}
          </div>

          {/* Due date */}
          <div>
            <label className="text-[10px] font-black tracking-widest uppercase mb-1.5 block" style={{ color: '#94a3b8' }}>
              Data de vencimento{needsDate ? <span style={{ color: '#dc2626' }}> *</span> : ' (opcional)'}
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="w-full rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none"
              style={{
                background: needsDate && !form.dueDate ? '#fff7ed' : '#f8fafc',
                border: `1.5px solid ${needsDate && !form.dueDate ? '#fcd34d' : '#e2e8f0'}`,
                color: form.dueDate ? '#0f172a' : '#94a3b8',
                fontFamily: 'inherit',
              }}
            />
            {needsDate && !form.dueDate && (
              <p className="text-[10px] mt-1 font-semibold" style={{ color: '#d97706' }}>
                Obrigatória para contas recorrentes
              </p>
            )}
          </div>

          {/* Recurrence */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw size={12} style={{ color: '#94a3b8' }} />
              <label className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#94a3b8' }}>
                Repetição
              </label>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {RECURRENCE_ORDER.map(r => {
                const selected = form.recurrence === r;
                return (
                  <button
                    key={r}
                    onClick={() => setForm(f => ({ ...f, recurrence: r }))}
                    className="flex-shrink-0 rounded-full px-3.5 py-2 text-xs font-black transition-all active:scale-95"
                    style={{
                      background: selected ? '#7c3aed' : '#f1f5f9',
                      color:      selected ? '#fff'    : '#64748b',
                    }}
                  >
                    {RECURRENCE_META[r].label}
                  </button>
                );
              })}
            </div>

            {/* Occurrences stepper — only when recurring */}
            {isRecurring && (
              <div
                className="mt-3 rounded-2xl p-4"
                style={{ background: '#faf5ff', border: '1.5px solid #e9d5ff' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-black" style={{ color: '#7c3aed' }}>Quantas vezes?</p>
                    <p className="text-[10px]" style={{ color: '#a78bfa' }}>
                      Serão criadas {form.occurrences} entradas automaticamente
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setOccurrences(-1)}
                      disabled={form.occurrences <= 2}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                      style={{ background: '#ede9fe', border: '1.5px solid #c4b5fd' }}
                    >
                      <Minus size={14} style={{ color: '#7c3aed' }} />
                    </button>
                    <span className="text-xl font-black w-6 text-center" style={{ color: '#7c3aed' }}>
                      {form.occurrences}
                    </span>
                    <button
                      onClick={() => setOccurrences(+1)}
                      disabled={form.occurrences >= 24}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
                      style={{ background: '#ede9fe', border: '1.5px solid #c4b5fd' }}
                    >
                      <Plus size={14} style={{ color: '#7c3aed' }} />
                    </button>
                  </div>
                </div>

                {/* Date preview */}
                {previewDates.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black tracking-widest uppercase mb-2" style={{ color: '#a78bfa' }}>
                      Datas que serão criadas
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {previewDates.map((d, i) => (
                        <span
                          key={d}
                          className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                          style={{
                            background: i === 0 ? '#7c3aed' : '#ede9fe',
                            color:      i === 0 ? '#fff'    : '#7c3aed',
                          }}
                        >
                          {i === 0 ? '📌 ' : ''}{formatPreviewDate(d)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-black tracking-widest uppercase mb-1.5 block" style={{ color: '#94a3b8' }}>
              Observações (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Parcela 3/12, juros 2%..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none"
              style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#0f172a', fontFamily: 'inherit' }}
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full h-14 rounded-2xl text-base font-black active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            style={{
              background: canSave
                ? `linear-gradient(135deg, ${meta.color}dd, ${meta.color})`
                : '#e2e8f0',
              color: canSave ? '#fff' : '#94a3b8',
              fontFamily: 'inherit',
              boxShadow: canSave ? `0 4px 20px ${meta.color}44` : 'none',
            }}
          >
            <Check size={18} strokeWidth={3} />
            {editAccount
              ? 'Salvar alterações'
              : isRecurring
                ? `Criar ${form.occurrences} entradas`
                : 'Adicionar conta'}
          </button>
        </div>
      </div>
    </>
  );
}
