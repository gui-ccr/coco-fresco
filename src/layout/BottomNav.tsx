import { LayoutDashboard, Briefcase, Home, ShoppingBag, BarChart2, Settings } from 'lucide-react';

export const NAV_TABS = [
  { id: 'dashboard',  label: 'Resumo',    Icon: LayoutDashboard, isSecondary: false },
  { id: 'trabalho',   label: 'Trabalho',  Icon: Briefcase,       isSecondary: false },
  { id: 'casa',       label: 'Casa',      Icon: Home,            isSecondary: false },
  { id: 'aleatorio',  label: 'Gastos',    Icon: ShoppingBag,     isSecondary: false },
  { id: 'relatorio',  label: 'Histórico', Icon: BarChart2,       isSecondary: true  },
  { id: 'config',     label: 'Ajustes',   Icon: Settings,        isSecondary: true  },
] as const;

export type TabId = (typeof NAV_TABS)[number]['id'];
export const TAB_ORDER = NAV_TABS.map(t => t.id) as string[];

interface BottomNavProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 w-full max-w-md z-40 flex items-stretch"
      style={{
        background: '#ffffff',
        borderTop:  '1px solid #e2ede8',
        boxShadow:  '0 -4px 24px rgba(0,0,0,0.06)',
        height:     '60px',
      }}
    >
      {NAV_TABS.map(({ id, label, Icon, isSecondary }) => {
        const active      = activeTab === id;
        const activeColor = isSecondary ? '#4f46e5' : '#059669';

        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 relative"
            style={{ flex: 1, paddingBottom: '2px' }}
          >
            <Icon
              size={isSecondary ? 17 : 19}
              strokeWidth={active ? 2.5 : 1.8}
              style={{ color: active ? activeColor : '#94a3b8' }}
            />
            <span
              className="text-[9px] font-bold tracking-wide"
              style={{ color: active ? activeColor : '#94a3b8' }}
            >
              {label}
            </span>
            {active && (
              <span
                className="absolute bottom-0 rounded-full"
                style={{ width: 24, height: 2, background: activeColor }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
