import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { X, ChevronRight, Zap, AlertTriangle, Check, Settings, CalendarDays } from 'lucide-react';
import { type Category, type Transaction, CATEGORY_META, QUICK_SALE_CATS, REPO_CATS } from '@/shared/types/transaction';
import { type AreaId } from '@/shared/types/area';
import { type AppSettings, DEFAULT_SETTINGS } from '@/shared/types/settings';
import { formatBRL } from '@/shared/lib/format';
import { EXPENSE_GROUPS } from './constants/expenseGroups';
import { useSettingsQuery } from '@/shared/hooks/queries/useSettingsQuery';

type Step = 'category' | 'quick_qty' | 'quantity' | 'amount' | 'confirm';

function todayValue(): string {
  return new Date().toLocaleDateString('en-CA');
}

interface Props {
  isOpen:          boolean;
  onClose:         () => void;
  onSave:          (tx: Omit<Transaction, 'id' | 'when'>, when: string) => void;
  onUpdate?:       (id: string, tx: Omit<Transaction, 'id' | 'when'>, when: string) => void;
  editingTx?:      Transaction | null;
  areaFilter?:     AreaId;
  onGoToSettings?: () => void;
}

export function NovaTransacaoModal({ isOpen, onClose, onSave, onUpdate, editingTx, areaFilter, onGoToSettings }: Props) {
  const { data: settings = DEFAULT_SETTINGS } = useSettingsQuery();
  const isEditMode       = !!editingTx;
  const showDatePicker   = !!areaFilter || isEditMode;
  const showQuickSales   = !areaFilter || areaFilter === 'trabalho';
  const visibleGroups    = areaFilter
    ? EXPENSE_GROUPS.filter(g =>
        areaFilter === 'trabalho'  ? g.label === 'REPOSIÇÃO DE ESTOQUE' :
        areaFilter === 'casa'      ? g.label === 'CASA'                 :
                                     g.label === 'GASTOS EXTRAS'
      )
    : EXPENSE_GROUPS;
  const [mounted, setMounted]         = useState(isOpen);
  const [step, setStep]               = useState<Step>('category');
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [quickQty, setQuickQty]       = useState('');
  const [quantity, setQuantity]       = useState('');
  const [amount, setAmount]           = useState('');
  const [note, setNote]               = useState('');
  const [selectedDate, setSelectedDate] = useState(todayValue());

  const sheetRef    = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  function resetState() {
    setStep('category');
    setSelectedCat(null);
    setQuickQty('');
    setQuantity('');
    setAmount('');
    setNote('');
    setSelectedDate(todayValue());
  }

  if (isOpen && !mounted) setMounted(true);

  useEffect(() => {
    if (isOpen) return;

    resetState();
    const sheet    = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!sheet) { setMounted(false); return; }

    gsap.to(sheet,    { y: '100%', duration: 0.35, ease: 'power3.in' });
    gsap.to(backdrop, { opacity: 0, duration: 0.28, onComplete: () => setMounted(false) });
  }, [isOpen]);

  // Pré-preenche os campos quando abre em modo edição
  useEffect(() => {
    if (!isOpen || !editingTx) return;

    setSelectedCat(editingTx.cat);
    setNote(editingTx.note ?? '');
    setSelectedDate(new Date(editingTx.when).toLocaleDateString('en-CA'));

    if (QUICK_SALE_CATS.includes(editingTx.cat)) {
      const unitPrice = settings.precoVenda[editingTx.cat as keyof AppSettings['precoVenda']] ?? 0;
      setQuickQty(unitPrice > 0 ? String(Math.round(editingTx.value / unitPrice)) : '1');
      setStep('quick_qty');
    } else if (REPO_CATS.includes(editingTx.cat)) {
      const cost = settings.custoUnit[editingTx.cat as keyof AppSettings['custoUnit']] ?? 0;
      setQuantity(cost > 0 ? String(Math.round(editingTx.value / cost)) : '1');
      setStep('quantity');
    } else {
      setAmount(editingTx.value.toFixed(2).replace('.', ','));
      setStep('amount');
    }
  }, [editingTx?.id, isOpen]);

  useEffect(() => {
    if (!mounted) return;
    const ctx = gsap.context(() => {
      const sheet    = sheetRef.current;
      const backdrop = backdropRef.current;
      if (!sheet || !backdrop) return;
      gsap.set(sheet,    { y: '100%' });
      gsap.set(backdrop, { opacity: 0 });
      gsap.to(sheet,    { y: '0%',   duration: 0.48, ease: 'expo.out'   });
      gsap.to(backdrop, { opacity: 1, duration: 0.28, ease: 'power2.out' });
    });
    return () => ctx.revert();
  }, [mounted]);

  if (!mounted) return null;

  // ── Navigation ────────────────────────────────────────────────────────────
  function handleCatSelect(cat: Category) {
    setSelectedCat(cat);
    if (QUICK_SALE_CATS.includes(cat)) { setQuickQty(''); setStep('quick_qty'); }
    else if (REPO_CATS.includes(cat))  { setQuantity(''); setStep('quantity'); }
    else                               { setAmount(''); setStep('amount'); }
  }

  function handleQuantityNext() {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return;
    setStep('confirm');
  }

  function handleAmountNext() {
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;
    setStep('confirm');
  }

  function handleConfirm() {
    const val = getFinalAmount();
    if (!selectedCat || val <= 0) return;
    const autoNote = buildAutoNote();
    // Lançamentos de hoje usam o horário real; datas passadas usam meio-dia
    // para evitar o bug de timezone onde YYYY-MM-DD sem hora é tratado como UTC
    const when = selectedDate === todayValue()
      ? new Date().toISOString()
      : new Date(selectedDate + 'T12:00:00').toISOString();
    const txData = { cat: selectedCat, value: val, note: note || autoNote || undefined };

    if (isEditMode && editingTx && onUpdate) {
      onUpdate(editingTx.id, txData, when);
    } else {
      onSave(txData, when);
    }
    onClose();
  }

  // ── Calculations ──────────────────────────────────────────────────────────
  function getFinalAmount(): number {
    if (!selectedCat) return 0;
    if (QUICK_SALE_CATS.includes(selectedCat)) {
      const unitPrice = settings.precoVenda[selectedCat as keyof AppSettings['precoVenda']] ?? 0;
      return parseFloat(((parseInt(quickQty) || 1) * unitPrice).toFixed(2));
    }
    if (REPO_CATS.includes(selectedCat)) {
      const qty  = parseInt(quantity) || 0;
      const cost = settings.custoUnit[selectedCat as keyof AppSettings['custoUnit']] ?? 0;
      return parseFloat((qty * cost).toFixed(2));
    }
    return parseFloat(amount.replace(',', '.')) || 0;
  }

  function getUnitCost(): number {
    if (!selectedCat || !REPO_CATS.includes(selectedCat)) return 0;
    return settings.custoUnit[selectedCat as keyof AppSettings['custoUnit']] ?? 0;
  }

  function buildAutoNote(): string {
    if (!selectedCat) return '';
    if (QUICK_SALE_CATS.includes(selectedCat)) {
      const qty = parseInt(quickQty) || 1;
      return qty > 1 ? `${qty} unidades` : '';
    }
    if (REPO_CATS.includes(selectedCat)) {
      const qty = parseInt(quantity) || 0;
      return `${qty} ${qty === 1 ? 'unidade' : 'unidades'}`;
    }
    return '';
  }

  function handleNumpad(digit: string, target: 'quickQty' | 'quantity' | 'amount') {
    if (target === 'amount') {
      if (digit === '⌫') { setAmount(prev => prev.slice(0, -1)); return; }
      if (digit === ',' && (amount.includes(',') || amount === '')) return;
      if (amount.split(',')[1]?.length >= 2) return;
      if (amount.length >= 6) return;
      setAmount(prev => prev + digit);
    } else {
      const setter  = target === 'quickQty' ? setQuickQty : setQuantity;
      const current = target === 'quickQty' ? quickQty    : quantity;
      if (digit === '⌫') { setter(prev => prev.slice(0, -1)); return; }
      if (current.length >= 4) return;
      setter(prev => prev + digit);
    }
  }

  const meta        = selectedCat ? CATEGORY_META[selectedCat] : null;
  const finalAmount = getFinalAmount();
  const unitCost    = getUnitCost();
  const qtyInt      = parseInt(quantity) || 0;
  const quickQtyInt = parseInt(quickQty) || 1;
  const costUnknown = selectedCat && REPO_CATS.includes(selectedCat) && unitCost === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.55)' }}
        onClick={onClose}
      />

      {/* Sheet */}
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
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full" style={{ background: '#e2e8f0' }} />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#94a3b8' }}>
              {isEditMode ? 'Editar lançamento' :
               step === 'category'  ? 'O que foi?' :
               step === 'quick_qty' ? 'Quantas unidades vendidas?' :
               step === 'quantity'  ? 'Quantas unidades?' :
               step === 'amount'    ? 'Qual o valor?' :
               'Confirmar registro'}
            </p>
            {meta && step !== 'category' && (
              <p className="text-base font-black mt-0.5" style={{ color: '#0f172a' }}>
                {meta.emoji} {meta.label}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36, background: '#f1f5f9' }}
          >
            <X size={17} style={{ color: '#64748b' }} />
          </button>
        </div>

        {/* Date selector — visible in area mode on all steps except confirm (confirm has its own) */}
        {showDatePicker && step !== 'confirm' && (
          <div className="px-5 pb-3 shrink-0">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd' }}
            >
              <CalendarDays size={14} style={{ color: '#0284c7' }} />
              <p className="text-[10px] font-black tracking-widest uppercase flex-1" style={{ color: '#0284c7' }}>
                Data do registro
              </p>
              <input
                type="date"
                value={selectedDate}
                max={todayValue()}
                onChange={e => setSelectedDate(e.target.value)}
                className="text-xs font-bold outline-none bg-transparent"
                style={{ color: '#0f172a', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        )}

        {/* ── STEP 1 — Escolher categoria ── */}
        {step === 'category' && (
          <div className="flex-1 overflow-y-auto px-5 pb-8">
            {showQuickSales && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={13} style={{ color: '#059669' }} />
                  <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#059669' }}>
                    VENDA RÁPIDA — 1 TOQUE
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {QUICK_SALE_CATS.map(cat => {
                    const m     = CATEGORY_META[cat];
                    const preco = settings.precoVenda[cat as keyof AppSettings['precoVenda']];
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCatSelect(cat)}
                        className="relative flex flex-col items-start rounded-2xl p-4 text-left active:scale-95 transition-all duration-100"
                        style={{ background: 'linear-gradient(145deg,#ecfdf5,#d1fae5)', border: '2px solid #6ee7b7' }}
                      >
                        <span
                          className="absolute top-2.5 right-2.5 text-[9px] font-black uppercase tracking-wider rounded-full px-1.5 py-0.5"
                          style={{ background: '#059669', color: '#fff' }}
                        >1 tap</span>
                        <span className="text-3xl mb-2 leading-none">{m.emoji}</span>
                        <p className="text-sm font-black leading-tight" style={{ color: '#065f46' }}>{m.label}</p>
                        <p className="text-xl font-black tabular-nums mt-0.5" style={{ color: '#059669' }}>
                          {formatBRL(preco)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {visibleGroups.map(group => (
              <div key={group.label} className="mb-5">
                <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: '#94a3b8' }}>
                  {group.label}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {group.cats.map(cat => {
                    const m = CATEGORY_META[cat];
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCatSelect(cat)}
                        className="flex items-center gap-3 rounded-2xl p-3 text-left active:scale-95 transition-all duration-100"
                        style={{ background: m.bg, border: `1.5px solid ${m.color}22` }}
                      >
                        <span className="text-2xl leading-none">{m.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold leading-tight truncate" style={{ color: m.color }}>{m.label}</p>
                          <p className="text-[10px] font-medium" style={{ color: '#94a3b8' }}>
                            {m.isRepo ? 'reposição' : 'saída'}
                          </p>
                        </div>
                        <ChevronRight size={13} style={{ color: m.color, flexShrink: 0 }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 1B — Quantidade de venda rápida ── */}
        {step === 'quick_qty' && meta && (
          <div className="flex flex-col pb-6 shrink-0">
            <div
              className="mx-5 mb-2 rounded-2xl flex flex-col items-center justify-center py-5"
              style={{ background: 'linear-gradient(145deg, #ecfdf5, #d1fae5)' }}
            >
              <p className="text-5xl font-black tabular-nums" style={{ color: '#059669' }}>{quickQtyInt}</p>
              <p className="text-xs font-bold mt-1" style={{ color: '#6ee7b7' }}>
                {quickQtyInt === 1 ? 'unidade' : 'unidades'}
              </p>
            </div>

            <div
              className="mx-5 mb-3 rounded-xl px-4 py-2.5 flex items-center justify-between"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
            >
              <p className="text-xs font-medium" style={{ color: '#065f46' }}>
                {quickQtyInt} × {formatBRL(settings.precoVenda[selectedCat! as keyof AppSettings['precoVenda']] ?? 0)}
              </p>
              <p className="text-base font-black tabular-nums" style={{ color: '#059669' }}>
                = {formatBRL(finalAmount)}
              </p>
            </div>

            <div className="px-5 grid grid-cols-3 gap-2 mb-4">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key) => (
                key === '' ? <div key="spacer" /> : (
                  <button
                    key={key}
                    onClick={() => handleNumpad(key, 'quickQty')}
                    className="h-13 rounded-2xl text-lg font-bold active:scale-95 transition-all duration-75"
                    style={{
                      height: '52px',
                      background: key === '⌫' ? '#fee2e2' : '#f8fafc',
                      color:      key === '⌫' ? '#dc2626' : '#0f172a',
                      border: '1.5px solid #e2e8f0',
                      fontFamily: 'inherit',
                    }}
                  >{key}</button>
                )
              ))}
            </div>

            <div className="px-5 flex gap-3">
              <button
                onClick={() => setStep('category')}
                className="flex-1 h-14 rounded-2xl text-sm font-bold"
                style={{ background: '#f1f5f9', color: '#64748b', fontFamily: 'inherit' }}
              >Voltar</button>
              <button
                onClick={() => setStep('confirm')}
                disabled={quickQtyInt <= 0}
                className="flex-2 h-14 rounded-2xl text-sm font-bold active:scale-95 disabled:opacity-40 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff', fontFamily: 'inherit',
                  boxShadow: '0 4px 16px rgba(5,150,105,0.4)',
                }}
              >Continuar →</button>
            </div>
          </div>
        )}

        {/* ── STEP 2A — Quantidade (reposição) ── */}
        {step === 'quantity' && meta && (
          <div className="flex flex-col pb-6 shrink-0">
            {costUnknown && (
              <div
                className="mx-5 mb-4 rounded-2xl p-4 flex items-start gap-3"
                style={{ background: '#fffbeb', border: '1.5px solid #fcd34d' }}
              >
                <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: '#92400e' }}>
                    Custo unitário não configurado
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>
                    O total não será calculado. Configure o custo em Ajustes.
                  </p>
                  {onGoToSettings && (
                    <button
                      onClick={() => { onClose(); onGoToSettings(); }}
                      className="mt-2 flex items-center gap-1 text-xs font-bold"
                      style={{ color: '#d97706' }}
                    >
                      <Settings size={12} /> Ir para Ajustes
                    </button>
                  )}
                </div>
              </div>
            )}

            <div
              className="mx-5 mb-2 rounded-2xl flex flex-col items-center justify-center py-5"
              style={{ background: meta.bg }}
            >
              <p className="text-5xl font-black tabular-nums" style={{ color: meta.color }}>
                {quantity || '0'}
              </p>
              <p className="text-xs font-bold mt-1" style={{ color: meta.color + 'aa' }}>
                {quantity === '1' ? 'unidade' : 'unidades'}
              </p>
            </div>

            {!costUnknown && qtyInt > 0 && (
              <div className="mx-5 mb-3 rounded-xl px-4 py-2.5 flex items-center justify-between"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="text-xs font-medium" style={{ color: '#64748b' }}>
                  {qtyInt} × {formatBRL(unitCost)}
                </p>
                <p className="text-base font-black tabular-nums" style={{ color: meta.color }}>
                  = {formatBRL(finalAmount)}
                </p>
              </div>
            )}

            <div className="px-5 grid grid-cols-3 gap-2 mb-4">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key) => (
                key === '' ? <div key="spacer" /> : (
                  <button
                    key={key}
                    onClick={() => handleNumpad(key, 'quantity')}
                    disabled={!!costUnknown}
                    className="h-14 rounded-2xl text-lg font-bold active:scale-95 transition-all duration-75 disabled:opacity-30"
                    style={{
                      background: key === '⌫' ? '#fee2e2' : '#f8fafc',
                      color:      key === '⌫' ? '#dc2626' : '#0f172a',
                      border: '1.5px solid #e2e8f0',
                      fontFamily: 'inherit',
                    }}
                  >{key}</button>
                )
              ))}
            </div>

            <div className="px-5 flex gap-3">
              <button
                onClick={() => setStep('category')}
                className="flex-1 h-14 rounded-2xl text-sm font-bold"
                style={{ background: '#f1f5f9', color: '#64748b', fontFamily: 'inherit' }}
              >Voltar</button>
              <button
                onClick={handleQuantityNext}
                disabled={!!costUnknown || !quantity || qtyInt <= 0}
                className="flex-2 h-14 rounded-2xl text-sm font-bold active:scale-95 disabled:opacity-40 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${meta.color}dd, ${meta.color})`,
                  color: '#fff', fontFamily: 'inherit',
                  boxShadow: `0 4px 16px ${meta.color}44`,
                }}
              >Continuar →</button>
            </div>
          </div>
        )}

        {/* ── STEP 2B — Valor manual ── */}
        {step === 'amount' && meta && (
          <div className="flex flex-col pb-6 shrink-0">
            <div
              className="mx-5 mb-4 rounded-2xl flex flex-col items-center justify-center py-5"
              style={{ background: meta.bg }}
            >
              <p className="text-4xl font-black tracking-tight tabular-nums" style={{ color: meta.color }}>
                {amount ? `R$ ${amount}` : 'R$ 0,00'}
              </p>
            </div>

            <div className="px-5 grid grid-cols-3 gap-2 mb-4">
              {['1','2','3','4','5','6','7','8','9',',','0','⌫'].map(key => (
                <button
                  key={key}
                  onClick={() => handleNumpad(key, 'amount')}
                  className="h-14 rounded-2xl text-lg font-bold active:scale-95 transition-all duration-75"
                  style={{
                    background: key === '⌫' ? '#fee2e2' : '#f8fafc',
                    color:      key === '⌫' ? '#dc2626' : '#0f172a',
                    border: '1.5px solid #e2e8f0',
                    fontFamily: 'inherit',
                  }}
                >{key}</button>
              ))}
            </div>

            <div className="px-5 flex gap-3">
              <button
                onClick={() => setStep('category')}
                className="flex-1 h-14 rounded-2xl text-sm font-bold"
                style={{ background: '#f1f5f9', color: '#64748b', fontFamily: 'inherit' }}
              >Voltar</button>
              <button
                onClick={handleAmountNext}
                disabled={!amount || parseFloat(amount.replace(',', '.')) <= 0}
                className="flex-2 h-14 rounded-2xl text-sm font-bold active:scale-95 disabled:opacity-40 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${meta.color}dd, ${meta.color})`,
                  color: '#fff', fontFamily: 'inherit',
                  boxShadow: `0 4px 16px ${meta.color}44`,
                }}
              >Continuar →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3 — Confirmação ── */}
        {step === 'confirm' && meta && (
          <div className="flex flex-col pb-6 shrink-0 px-5">
            <div
              className="rounded-2xl p-5 mb-4"
              style={{
                background: meta.isIncome ? 'linear-gradient(145deg,#ecfdf5,#d1fae5)' : 'linear-gradient(145deg,#fff7ed,#ffedd5)',
                border: `2px solid ${meta.isIncome ? '#6ee7b7' : meta.color + '55'}`,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: 'rgba(255,255,255,0.7)' }}
                >
                  {meta.emoji}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: meta.color + 'bb' }}>
                    {meta.isIncome ? 'entrada' : meta.isRepo ? 'reposição' : 'saída'}
                  </p>
                  <p className="text-base font-black" style={{ color: meta.isIncome ? '#065f46' : '#7c2d12' }}>
                    {meta.label}
                  </p>
                </div>
              </div>

              {REPO_CATS.includes(selectedCat!) && (
                <div className="mb-3 rounded-xl px-3 py-2 flex justify-between"
                  style={{ background: 'rgba(255,255,255,0.5)' }}>
                  <p className="text-xs font-medium" style={{ color: '#64748b' }}>
                    {qtyInt} unidades × {formatBRL(unitCost)}
                  </p>
                  <p className="text-xs font-bold" style={{ color: meta.color }}>total</p>
                </div>
              )}

              {QUICK_SALE_CATS.includes(selectedCat!) && (
                <div className="mb-3 rounded-xl px-3 py-2 flex justify-between"
                  style={{ background: 'rgba(255,255,255,0.5)' }}>
                  <p className="text-xs font-medium" style={{ color: '#64748b' }}>
                    {quickQtyInt} {quickQtyInt === 1 ? 'unidade' : 'unidades'} × {formatBRL(settings.precoVenda[selectedCat! as keyof AppSettings['precoVenda']] ?? 0)}
                  </p>
                  <p className="text-xs font-bold" style={{ color: '#059669' }}>total</p>
                </div>
              )}

              <p
                className="text-4xl font-black tabular-nums"
                style={{ color: meta.isIncome ? '#059669' : meta.color }}
              >
                {meta.isIncome ? '+' : '−'} {formatBRL(finalAmount)}
              </p>
            </div>

            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <CalendarDays size={12} style={{ color: '#94a3b8' }} />
                <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#94a3b8' }}>Data</p>
              </div>
              <input
                type="date"
                value={selectedDate}
                max={todayValue()}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none"
                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#0f172a', fontFamily: 'inherit' }}
              />
            </div>

            <input
              type="text"
              placeholder="📝  Observação (opcional)..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none mb-4"
              style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#0f172a', fontFamily: 'inherit' }}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (QUICK_SALE_CATS.includes(selectedCat!)) setStep('quick_qty');
                  else if (REPO_CATS.includes(selectedCat!)) setStep('quantity');
                  else setStep('amount');
                }}
                className="flex-1 h-14 rounded-2xl text-sm font-bold"
                style={{ background: '#f1f5f9', color: '#64748b', fontFamily: 'inherit' }}
              >Voltar</button>

              <button
                onClick={handleConfirm}
                disabled={finalAmount <= 0}
                className="flex-2 h-14 rounded-2xl text-sm font-bold active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                style={{
                  background: meta.isIncome
                    ? 'linear-gradient(135deg,#10b981,#059669)'
                    : `linear-gradient(135deg,${meta.color}dd,${meta.color})`,
                  color: '#fff', fontFamily: 'inherit',
                  boxShadow: `0 4px 20px ${meta.isIncome ? '#05966955' : meta.color + '55'}`,
                }}
              >
                <Check size={18} strokeWidth={3} />
                {isEditMode ? 'Salvar alterações' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
