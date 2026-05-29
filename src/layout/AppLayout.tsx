import { useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { BottomNav, TAB_ORDER } from './BottomNav';
import { PageTransition } from './PageTransition';
import { MenuDrawer } from './MenuDrawer';

interface AppLayoutProps {
  activeTab:    string;
  setActiveTab: (tab: string) => void;
  onOpenModal:  () => void;
  children:     ReactNode;
}

export function AppLayout({ activeTab, setActiveTab, onOpenModal, children }: AppLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const showFab = !['config', 'accounts', 'notes'].includes(activeTab) && !isDrawerOpen;

  return (
    <div className="min-h-screen flex justify-center" style={{ background: '#f0f7f4' }}>
      <div className="w-full max-w-md relative flex flex-col" style={{ minHeight: '100svh' }}>

        <main className="flex-1 overflow-y-auto pb-[88px]" style={{ overflowX: 'hidden' }}>
          <PageTransition activeTab={activeTab} tabOrder={TAB_ORDER}>
            {children}
          </PageTransition>
        </main>

        {showFab && (
          <button
            onClick={onOpenModal}
            aria-label="Nova transação"
            className="fixed z-50 flex items-center justify-center rounded-full transition-all duration-150 active:scale-90"
            style={{
              bottom: '58px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 4px 24px rgba(5, 150, 105, 0.55)',
            }}
          >
            <Plus className="text-white" size={26} strokeWidth={2.8} />
          </button>
        )}

        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenMenu={() => setIsDrawerOpen(true)}
        />

        <MenuDrawer
          isOpen={isDrawerOpen}
          activeTab={activeTab}
          onClose={() => setIsDrawerOpen(false)}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  );
}
