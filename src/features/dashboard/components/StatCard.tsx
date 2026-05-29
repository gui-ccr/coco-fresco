import { formatBRL } from '@/shared/lib/format';

interface StatCardProps {
  label:      string;
  value:      number;
  icon:       string;
  isPositive: boolean;
}

export function StatCard({ label, value, icon, isPositive }: StatCardProps) {
  return (
    <div
      className="flex-1 rounded-2xl p-4"
      style={{ background: isPositive ? '#d1fae5' : '#fff7ed' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{icon}</span>
        <p
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: isPositive ? '#065f46' : '#9a3412' }}
        >
          {label}
        </p>
      </div>
      <p
        className="text-xl font-black tabular-nums leading-tight"
        style={{ color: isPositive ? '#059669' : '#ea580c' }}
      >
        {formatBRL(value)}
      </p>
    </div>
  );
}
