import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Sun, Check } from 'lucide-react';
import { formatBRL } from '@/shared/lib/format';

interface Props {
  onConfirm: (capitalInit: number) => void;
}

export function IniciarDiaModal({ onConfirm }: Props) {
  const [amount, setAmount] = useState('');
  const sheetRef    = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Entrada com animação — gsap.context garante cleanup correto no React StrictMode
  useEffect(() => {
    const ctx = gsap.context(() => {
      const sheet    = sheetRef.current;
      const backdrop = backdropRef.current;
      if (!sheet || !backdrop) return;
      gsap.set(sheet,    { y: '100%' });
      gsap.set(backdrop, { opacity: 0 });
      gsap.to(sheet,    { y: '0%',  duration: 0.52, ease: 'expo.out',   delay: 0.1 });
      gsap.to(backdrop, { opacity: 1, duration: 0.3, ease: 'power2.out', delay: 0.1 });
    });
    return () => ctx.revert();
  }, []);

  function handleNumpad(digit: string) {
    if (digit === '⌫') { setAmount(prev => prev.slice(0, -1)); return; }
    if (digit === ',' && (amount.includes(',') || amount === '')) return;
    if (amount.split(',')[1]?.length >= 2) return;
    if (amount.length >= 8) return;
    setAmount(prev => prev + digit);
  }

  const value = parseFloat(amount.replace(',', '.')) || 0;
  const canConfirm = value > 0;

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm(value);
  }

  return (
    <>
      {/* Backdrop — não fechável: dia PRECISA ser iniciado */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      />

      <div
        ref={sheetRef}
        className="fixed bottom-0 left-1/2 z-50 flex flex-col rounded-t-3xl"
        style={{
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: '448px',
          background: '#ffffff',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.22)',
          maxHeight: '92svh',
          willChange: 'transform',
          overflow: 'hidden',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1.5 rounded-full" style={{ background: '#e2e8f0' }} />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Header */}
          <div className="px-6 pt-3 pb-4 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'linear-gradient(135deg, #fef9c3, #fde68a)' }}
            >
              <Sun size={26} style={{ color: '#d97706' }} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black" style={{ color: '#0f172a' }}>
              Bom dia! ☀️
            </h2>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: '#64748b' }}>
              Com quanto você está começando o dia hoje?
            </p>
          </div>

          {/* Visor */}
          <div
            className="mx-5 mb-3 rounded-2xl flex flex-col items-center justify-center py-5"
            style={{ background: 'linear-gradient(145deg, #f0fdf4, #dcfce7)' }}
          >
            <p
              className="text-5xl font-black tabular-nums tracking-tight"
              style={{ color: amount ? '#059669' : '#94a3b8' }}
            >
              {amount ? `R$ ${amount}` : 'R$ 0,00'}
            </p>
            <p className="text-xs font-medium mt-1.5" style={{ color: '#6ee7b7' }}>
              capital inicial do dia
            </p>
          </div>

          {/* Preview */}
          {canConfirm && (
            <div
              className="mx-5 mb-2 rounded-xl px-4 py-2 flex items-center justify-between"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            >
              <p className="text-xs font-medium" style={{ color: '#64748b' }}>Você vai começar com</p>
              <p className="text-sm font-black tabular-nums" style={{ color: '#059669' }}>{formatBRL(value)}</p>
            </div>
          )}

          {/* Numpad */}
          <div className="px-5 grid grid-cols-3 gap-2 mb-3">
            {['1','2','3','4','5','6','7','8','9',',','0','⌫'].map(key => (
              <button
                key={key}
                onClick={() => handleNumpad(key)}
                className="h-14 rounded-2xl text-lg font-bold active:scale-95 transition-all duration-75"
                style={{
                  background: key === '⌫' ? '#fee2e2' : '#f8fafc',
                  color:      key === '⌫' ? '#dc2626' : '#0f172a',
                  border: '1.5px solid #e2e8f0',
                  fontFamily: 'inherit',
                }}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* CTA — fixo no rodapé */}
        <div className="px-5 pt-2 pb-6 flex-shrink-0" style={{ background: '#ffffff' }}>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="w-full h-14 rounded-2xl text-base font-black active:scale-95 disabled:opacity-35 transition-all flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              fontFamily: 'inherit',
              boxShadow: canConfirm ? '0 4px 24px rgba(5,150,105,0.45)' : 'none',
            }}
          >
            <Check size={20} strokeWidth={3} />
            Começar o Dia
          </button>
        </div>
      </div>
    </>
  );
}
