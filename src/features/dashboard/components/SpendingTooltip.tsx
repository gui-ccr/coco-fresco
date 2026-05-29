import { formatBRL } from '@/shared/lib/format';

interface SpendingTooltipProps {
  active?:  boolean;
  payload?: { name: string; value: number }[];
}

export function SpendingTooltip({ active, payload }: SpendingTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm font-bold"
      style={{ background: '#0f172a', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
    >
      {payload[0].name}: {formatBRL(payload[0].value)}
    </div>
  );
}
