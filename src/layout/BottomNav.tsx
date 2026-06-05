import { LayoutDashboard, Briefcase, Home, ShoppingBag, Menu } from 'lucide-react';

const PRIMARY_TABS = [
  { id: 'dashboard', label: 'Resumo',   Icon: LayoutDashboard, color: '#059669' },
  { id: 'trabalho',  label: 'Trabalho', Icon: Briefcase,       color: '#f97316' },
  { id: 'casa',      label: 'Casa',     Icon: Home,            color: '#dc2626' },
  { id: 'aleatorio', label: 'Gastos',   Icon: ShoppingBag,     color: '#db2777' },
] as const;

// Active color for each secondary tab — matches their page header gradient
const SECONDARY_COLORS: Record<string, string> = {
  estoque:   '#0369a1',
  relatorio: '#3730a3',
  notes:     '#d97706',
  config:    '#4f46e5',
};

export const SECONDARY_TAB_IDS = Object.keys(SECONDARY_COLORS);

// Full order for PageTransition direction calculation
export const TAB_ORDER: string[] = [
  'dashboard', 'trabalho', 'casa', 'aleatorio',
  'estoque', 'relatorio', 'notes', 'config',
];

interface BottomNavProps {
  activeTab:   string;
  onTabChange: (id: string) => void;
  onOpenMenu:  () => void;
}

export function BottomNav({ activeTab, onTabChange, onOpenMenu }: BottomNavProps) {
  const menuColor    = SECONDARY_COLORS[activeTab] ?? '#7c3aed';
  const isMenuActive = SECONDARY_TAB_IDS.includes(activeTab);

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
      {PRIMARY_TABS.map(({ id, label, Icon, color }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 relative"
            style={{ flex: 1, paddingBottom: '2px' }}
          >
            <Icon
              size={19}
              strokeWidth={active ? 2.5 : 1.8}
              style={{ color: active ? color : '#94a3b8' }}
            />
            <span
              className="text-[9px] font-bold tracking-wide"
              style={{ color: active ? color : '#94a3b8' }}
            >
              {label}
            </span>
            {active && (
              <span
                className="absolute bottom-0 rounded-full"
                style={{ width: 24, height: 2, background: color }}
              />
            )}
          </button>
        );
      })}

      {/* Hamburger — secondary navigation */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 relative"
        style={{ flex: 1, paddingBottom: '2px' }}
      >
        <Menu
          size={19}
          strokeWidth={isMenuActive ? 2.5 : 1.8}
          style={{ color: isMenuActive ? menuColor : '#94a3b8' }}
        />
        <span
          className="text-[9px] font-bold tracking-wide"
          style={{ color: isMenuActive ? menuColor : '#94a3b8' }}
        >
          Mais
        </span>
        {isMenuActive && (
          <span
            className="absolute bottom-0 rounded-full"
            style={{ width: 24, height: 2, background: menuColor }}
          />
        )}
      </button>
    </nav>
  );
}
