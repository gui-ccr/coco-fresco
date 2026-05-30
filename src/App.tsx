import { useState } from 'react';
import { AppLayout } from '@/layout/AppLayout';
import { NovaTransacaoModal } from '@/features/transactions/NovaTransacaoModal';
import { IniciarDiaModal } from '@/features/work-day/IniciarDiaModal';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { AreaView } from '@/features/work/AreaView';
import { SettingsView } from '@/features/settings/SettingsView';
import { RelatorioView } from '@/features/reports/RelatorioView';
import { AccountsView } from '@/features/accounts/AccountsView';
import { NotesView } from '@/features/notes/NotesView';
import { useTransactions } from '@/shared/hooks/useTransactions';
import { useSettings } from '@/shared/hooks/useSettings';
import { useWorkDay } from '@/shared/hooks/useWorkDay';
import { type AreaId } from '@/shared/types/area';

function App() {
  const [activeTab, setActiveTab]             = useState('dashboard');
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [modalAreaFilter, setModalAreaFilter] = useState<AreaId | undefined>();
  const [subModalOpen, setSubModalOpen]       = useState(false);

  const { transactions, addTransaction } = useTransactions();
  const { settings, updateSettings }     = useSettings();
  const { today, allDays, needsInit, loading: dayLoading, initDay } = useWorkDay();

  function openAreaModal(area: AreaId) {
    setModalAreaFilter(area);
    setIsModalOpen(true);
  }

  function openFabModal() {
    setModalAreaFilter(undefined);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    // não limpa modalAreaFilter aqui — o modal ainda anima o fechamento
    // e leria areaFilter=undefined durante a animação, mostrando tudo
    // é limpo em openFabModal / openAreaModal antes de cada abertura
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView transactions={transactions} workDay={today} />;
      case 'trabalho':  return <AreaView areaId="trabalho"  transactions={transactions} onAdd={() => openAreaModal('trabalho')} />;
      case 'casa':      return <AreaView areaId="casa"      transactions={transactions} onAdd={() => openAreaModal('casa')} />;
      case 'aleatorio': return <AreaView areaId="aleatorio" transactions={transactions} onAdd={() => openAreaModal('aleatorio')} />;
      case 'relatorio': return <RelatorioView transactions={transactions} workDays={allDays} onSubModalChange={setSubModalOpen} />;
      case 'accounts':  return <AccountsView />;
      case 'notes':     return <NotesView />;
      case 'config':    return <SettingsView settings={settings} updateSettings={updateSettings} />;
      default:          return <DashboardView transactions={transactions} workDay={today} />;
    }
  };

  return (
    <>
      <AppLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenModal={openFabModal}
        subModalOpen={subModalOpen}
      >
        {renderContent()}
      </AppLayout>

      <NovaTransacaoModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={(tx, when) => addTransaction(tx, when)}
        settings={settings}
        areaFilter={modalAreaFilter}
        onGoToSettings={() => setActiveTab('config')}
      />

      {!dayLoading && needsInit && (
        <IniciarDiaModal onConfirm={initDay} />
      )}
    </>
  );
}

export default App;
