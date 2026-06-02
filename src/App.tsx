import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/layout/AppLayout';
import { NovaTransacaoModal } from '@/features/transactions/NovaTransacaoModal';
import { IniciarDiaModal } from '@/features/work-day/IniciarDiaModal';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { AreaView } from '@/features/work/AreaView';
import { SettingsView } from '@/features/settings/SettingsView';
import { RelatorioView } from '@/features/reports/RelatorioView';
import { AccountsView } from '@/features/accounts/AccountsView';
import { NotesView } from '@/features/notes/NotesView';
import { useAddTransactionMutation } from '@/shared/hooks/queries/useTransactionsQuery';
import { useWorkDayQuery, useInitDayMutation } from '@/shared/hooks/queries/useWorkDayQuery';
import { todayDate } from '@/shared/lib/format';
import type { AreaId } from '@/shared/types/area';

function App() {
  const {
    activeTab, setActiveTab,
    isModalOpen, modalAreaFilter,
    subModalOpen, setSubModalOpen,
    openAreaModal, openFabModal, closeModal,
  } = useApp();

  const { needsInit }      = useWorkDayQuery();
  const addTxMutation      = useAddTransactionMutation();
  const initDayMutation    = useInitDayMutation();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'trabalho':  return <AreaView areaId="trabalho"  onAdd={() => openAreaModal('trabalho'  as AreaId)} />;
      case 'casa':      return <AreaView areaId="casa"      onAdd={() => openAreaModal('casa'      as AreaId)} />;
      case 'aleatorio': return <AreaView areaId="aleatorio" onAdd={() => openAreaModal('aleatorio' as AreaId)} />;
      case 'relatorio': return <RelatorioView onSubModalChange={setSubModalOpen} />;
      case 'accounts':  return <AccountsView />;
      case 'notes':     return <NotesView />;
      case 'config':    return <SettingsView />;
      default:          return <DashboardView />;
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
        onSave={(tx, when) => addTxMutation.mutate({ tx, when })}
        areaFilter={modalAreaFilter}
        onGoToSettings={() => setActiveTab('config')}
      />

      {needsInit && (
        <IniciarDiaModal
          onConfirm={(capitalInit) =>
            initDayMutation.mutate({ date: todayDate(), capitalInit })
          }
        />
      )}
    </>
  );
}

export default App;
