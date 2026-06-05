import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { BarChart2, StickyNote, Settings, X, Package } from 'lucide-react';

const MENU_ITEMS = [
  {
    id:          'estoque',
    label:       'Estoque',
    description: 'Copos e garrafas do dia',
    Icon:        Package,
    color:       '#0369a1',
    bg:          '#e0f2fe',
  },
  {
    id:          'relatorio',
    label:       'Relatório',
    description: 'Histórico de dias trabalhados',
    Icon:        BarChart2,
    color:       '#3730a3',
    bg:          '#e0e7ff',
  },
  {
    id:          'notes',
    label:       'Anotações',
    description: 'Notas e lembretes pessoais',
    Icon:        StickyNote,
    color:       '#d97706',
    bg:          '#fef3c7',
  },
  {
    id:          'config',
    label:       'Ajustes',
    description: 'Preços e custo de reposição',
    Icon:        Settings,
    color:       '#4f46e5',
    bg:          '#eef2ff',
  },
] as const;

interface MenuDrawerProps {
  isOpen:      boolean;
  activeTab:   string;
  onClose:     () => void;
  onTabChange: (id: string) => void;
}

export function MenuDrawer({ isOpen, activeTab, onClose, onTabChange }: MenuDrawerProps) {
  const drawerRef   = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const mountedRef  = useRef(false);

  useEffect(() => {
    const drawer   = drawerRef.current;
    const backdrop = backdropRef.current;
    if (!drawer || !backdrop) return;

    if (isOpen) {
      mountedRef.current = true;
      drawer.style.display   = 'flex';
      backdrop.style.display = 'block';
      gsap.fromTo(drawer,   { x: '100%' }, { x: '0%',   duration: 0.38, ease: 'power3.out' });
      gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: 'power2.out' });
    } else if (mountedRef.current) {
      gsap.to(drawer,   { x: '100%',  duration: 0.32, ease: 'power3.in' });
      gsap.to(backdrop, {
        opacity: 0, duration: 0.25,
        onComplete: () => {
          drawer.style.display   = 'none';
          backdrop.style.display = 'none';
        },
      });
    }
  }, [isOpen]);

  function handleSelect(id: string) {
    onTabChange(id);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)', display: 'none' }}
        onClick={onClose}
      />

      {/* Drawer — slides from right, anchored to the app max-width */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 z-40 h-full flex-col"
        style={{
          width: '78%',
          maxWidth: '300px',
          background: '#fff',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
          display: 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-12 pb-6">
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#94a3b8' }}>
              Navegação
            </p>
            <p className="text-lg font-black mt-0.5" style={{ color: '#0f172a' }}>Menu</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{ width: 36, height: 36, background: '#f1f5f9' }}
          >
            <X size={17} style={{ color: '#64748b' }} />
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 px-4 space-y-2">
          {MENU_ITEMS.map(({ id, label, description, Icon, color, bg }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 text-left transition-all active:scale-98"
                style={{
                  background: active ? bg : '#f8fafc',
                  border: `1.5px solid ${active ? color + '44' : '#f1f5f9'}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: active ? color : '#e2e8f0' }}
                >
                  <Icon size={18} style={{ color: active ? '#fff' : '#64748b' }} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black" style={{ color: active ? color : '#0f172a' }}>{label}</p>
                  <p className="text-[10px] truncate" style={{ color: '#94a3b8' }}>{description}</p>
                </div>
                {active && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 pb-10">
          <div className="rounded-2xl p-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p className="text-[15px] font-bold" style={{ color: '#059669' }}>❤️ A melhor mãe do mundo ❤️</p>
            <p className="text-[14px] mt-0.5" style={{ color: '#469978' }}>
              Gestão simplificada pro seu dia a dia!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
