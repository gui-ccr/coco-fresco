import { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { TrendingUp, TrendingDown, Wallet, CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatBRL } from '@/shared/lib/format';
import { DayCard, buildSummaries } from './components/DayCard';
import { Pagination } from '@/shared/components/Pagination';
import { useTransactionsQuery } from '@/shared/hooks/queries/useTransactionsQuery';
import { useWorkDayQuery } from '@/shared/hooks/queries/useWorkDayQuery';

interface Props {
  onSubModalChange?: (open: boolean) => void;
}

type Period = 'all' | 'week' | 'month';

const PAGE_SIZE = 4;
const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function toYMD(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

// ── Animated list wrapper ──────────────────────────────────────────────────

function AnimatedList({ page, children }: { page: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' }
    );
  }, [page]);

  return <div ref={ref}>{children}</div>;
}

// ── Calendar modal ─────────────────────────────────────────────────────────

interface CalendarProps {
  isOpen:      boolean;
  recordDates: Set<string>;
  selected:    string | null;
  onSelect:    (date: string | null) => void;
  onClose:     () => void;
}

function Calendar({ isOpen, recordDates, selected, onSelect, onClose }: CalendarProps) {
  const sheetRef    = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(isOpen);

  const today = new Date();
  const [viewDate, setViewDate] = useState(() => {
    if (selected) return new Date(selected + 'T12:00:00');
    const dates = [...recordDates].sort().reverse();
    return dates.length ? new Date(dates[0] + 'T12:00:00') : today;
  });

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel  = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const nextDisabled = new Date(year, month + 1, 1) > today;

  // mount when open flips true
  if (isOpen && !mounted) setMounted(true);

  // close animation
  useEffect(() => {
    if (isOpen) return;
    const sheet    = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!sheet) { setMounted(false); return; }
    gsap.to(sheet,    { y: '100%', duration: 0.32, ease: 'power3.in' });
    gsap.to(backdrop, { opacity: 0, duration: 0.25, onComplete: () => setMounted(false) });
  }, [isOpen]);

  // open animation
  useLayoutEffect(() => {
    if (!mounted) return;
    const sheet    = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!sheet || !backdrop) return;
    gsap.set(sheet,    { y: '100%' });
    gsap.set(backdrop, { opacity: 0 });
    gsap.to(sheet,    { y: '0%',   duration: 0.42, ease: 'expo.out' });
    gsap.to(backdrop, { opacity: 1, duration: 0.25, ease: 'power2.out' });
  }, [mounted]);

  if (!mounted) return null;

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
        className="fixed bottom-0 left-1/2 z-50 w-full max-w-md rounded-t-3xl"
        style={{
          transform: 'translateX(-50%)',
          background: '#fff',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
          height: '78svh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full" style={{ background: '#e2e8f0' }} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-2">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="w-9 h-9 flex items-center justify-center rounded-xl active:scale-90 transition-all"
              style={{ background: '#f1f5f9' }}
            >
              <ChevronLeft size={18} style={{ color: '#475569' }} />
            </button>
            <p className="text-sm font-black capitalize" style={{ color: '#0f172a' }}>{monthLabel}</p>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              disabled={nextDisabled}
              className="w-9 h-9 flex items-center justify-center rounded-xl active:scale-90 transition-all disabled:opacity-30"
              style={{ background: '#f1f5f9' }}
            >
              <ChevronRight size={18} style={{ color: '#475569' }} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEK_DAYS.map((d, i) => (
              <p key={i} className="text-center text-[10px] font-black uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                {d}
              </p>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-2">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const ymd       = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasRecord  = recordDates.has(ymd);
              const isSelected = ymd === selected;
              const isToday    = ymd === toYMD(today);
              const isFuture   = ymd > toYMD(today);

              return (
                <button
                  key={i}
                  onClick={() => onSelect(isSelected ? null : ymd)}
                  disabled={isFuture || !hasRecord}
                  className="flex flex-col items-center justify-center py-2 rounded-xl transition-all active:scale-90 disabled:opacity-25"
                  style={{
                    background: isSelected ? '#059669' : hasRecord ? '#d1fae5' : 'transparent',
                  }}
                >
                  <span
                    className="text-sm font-bold leading-none"
                    style={{ color: isSelected ? '#fff' : hasRecord ? '#065f46' : '#94a3b8' }}
                  >
                    {day}
                  </span>
                  {isToday && (
                    <span
                      className="w-1 h-1 rounded-full mt-0.5"
                      style={{ background: isSelected ? 'rgba(255,255,255,0.6)' : '#059669' }}
                    />
                  )}
                  {hasRecord && !isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: '#6ee7b7' }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-5 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: '#d1fae5', border: '1px solid #6ee7b7' }} />
              <span className="text-[10px] font-semibold" style={{ color: '#94a3b8' }}>Com registro</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: '#059669' }} />
              <span className="text-[10px] font-semibold" style={{ color: '#94a3b8' }}>Selecionado</span>
            </div>
          </div>

          {/* Clear */}
          {selected && (
            <button
              onClick={() => onSelect(null)}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold active:scale-95 transition-all"
              style={{ background: '#f1f5f9', color: '#64748b' }}
            >
              <X size={14} /> Limpar seleção
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────

export function RelatorioView({ onSubModalChange }: Props) {
  const { data: transactions = [] } = useTransactionsQuery();
  const { data: workDays = [] }     = useWorkDayQuery();
  const [period, setPeriod]             = useState<Period>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [page, setPage]                 = useState(0);

  function openCalendar()  { setCalendarOpen(true);  onSubModalChange?.(true);  }
  function closeCalendar() { setCalendarOpen(false); onSubModalChange?.(false); }

  const allSummaries = useMemo(
    () => buildSummaries(workDays, transactions),
    [workDays, transactions]
  );

  const recordDates = useMemo(
    () => new Set(workDays.map(w => w.date)),
    [workDays]
  );

  const filtered = useMemo(() => {
    if (selectedDate) return allSummaries.filter(s => s.workDay.date === selectedDate);

    const now = new Date();
    if (period === 'week') {
      const mon = new Date(now); mon.setDate(now.getDate() - now.getDay());
      const sun = new Date(now); sun.setDate(now.getDate() + (6 - now.getDay()));
      const from = toYMD(mon), to = toYMD(sun);
      return allSummaries.filter(s => s.workDay.date >= from && s.workDay.date <= to);
    }
    if (period === 'month') {
      const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const to   = toYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      return allSummaries.filter(s => s.workDay.date >= from && s.workDay.date <= to);
    }
    return allSummaries;
  }, [allSummaries, period, selectedDate]);

  const totals = useMemo(() => ({
    totalEntradas: filtered.reduce((s, d) => s + d.entradas, 0),
    totalSaidas:   filtered.reduce((s, d) => s + d.saidas,   0),
    totalDias:     filtered.length,
  }), [filtered]);

  function handlePeriod(p: Period) {
    setPeriod(p);
    setSelectedDate(null);
    setPage(0);
  }

  function handleDateSelect(date: string | null) {
    setSelectedDate(date);
    setPage(0);
    if (date) setPeriod('all');
    closeCalendar();
  }

  const paginated = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      {/* ─── Header ─── */}
      <div
        className="relative px-5 pt-14 pb-6"
        style={{ background: 'linear-gradient(160deg, #1e1b4b, #3730a3)', borderRadius: '0 0 2rem 2rem' }}
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
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-indigo-300" />
              <p className="text-indigo-300 text-sm font-semibold">Histórico</p>
            </div>
            <button
              onClick={openCalendar}
              className="flex items-center gap-1.5 rounded-2xl px-3 py-2 active:scale-95 transition-all"
              style={{
                background: selectedDate ? '#4f46e5' : 'rgba(255,255,255,0.15)',
                border: `1.5px solid ${selectedDate ? '#6366f1' : 'rgba(255,255,255,0.25)'}`,
              }}
            >
              <CalendarDays size={13} className="text-white" />
              <span className="text-xs font-black text-white">
                {selectedDate
                  ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                  : 'Escolher data'}
              </span>
            </button>
          </div>

          <h1 className="text-white text-2xl font-black mb-4">Relatório por Dia</h1>

          {/* Period filters */}
          <div className="flex gap-2 mb-4">
            {(['all', 'week', 'month'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => handlePeriod(p)}
                className="rounded-xl px-3 py-1.5 text-xs font-black transition-all active:scale-95"
                style={{
                  background: period === p && !selectedDate ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                  color:      period === p && !selectedDate ? '#3730a3' : 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                {p === 'all' ? 'Tudo' : p === 'week' ? 'Esta semana' : 'Este mês'}
              </button>
            ))}
          </div>

          {/* Totals */}
          {totals.totalDias > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Dias',   value: String(totals.totalDias), icon: null },
                { label: 'Entrou', value: formatBRL(totals.totalEntradas), icon: <TrendingUp size={10} className="text-emerald-400" /> },
                { label: 'Saiu',   value: formatBRL(totals.totalSaidas),   icon: <TrendingDown size={10} className="text-red-300" /> },
              ].map(item => (
                <div key={item.label} className="rounded-2xl p-3" style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <div className="flex items-center gap-1 mb-1">
                    {item.icon}
                    <p className="text-indigo-300 text-[9px] font-black uppercase tracking-wider">{item.label}</p>
                  </div>
                  <p className="text-white font-black tabular-nums" style={{ fontSize: item.label === 'Dias' ? 20 : 13 }}>{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Lista de dias ─── */}
      <div className="px-4 pt-5 pb-8">
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl p-8 flex flex-col items-center gap-3"
            style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
          >
            <Wallet size={36} style={{ color: '#cbd5e1' }} />
            <p className="text-sm font-medium text-center" style={{ color: '#94a3b8' }}>
              {selectedDate ? 'Nenhum registro nesta data.' : 'Nenhum dia registrado ainda.'}
            </p>
          </div>
        ) : (
          <>
            <AnimatedList page={page}>
              <div className="space-y-3">
                {paginated.map(s => <DayCard key={s.workDay.id} summary={s} />)}
              </div>
            </AnimatedList>
            <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>

      {/* ─── Calendar ─── */}
      <Calendar
        isOpen={calendarOpen}
        recordDates={recordDates}
        selected={selectedDate}
        onSelect={handleDateSelect}
        onClose={closeCalendar}
      />
    </div>
  );
}
