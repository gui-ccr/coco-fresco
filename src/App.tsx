import { useState } from 'react';
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
import { EstoqueView } from '@/features/estoque/EstoqueView';
import {
  useAddTransactionMutation,
  useUpdateTransactionMutation,
  useRemoveTransactionMutation,
} from '@/shared/hooks/queries/useTransactionsQuery';
import { useWorkDayQuery, useInitDayMutation } from '@/shared/hooks/queries/useWorkDayQuery';
import { todayDate } from '@/shared/lib/format';
import type { AreaId } from '@/shared/types/area';
import type { Transaction } from '@/shared/types/transaction';

function App() {
  const {
    activeTab, setActiveTab,
    isModalOpen, modalAreaFilter,
    subModalOpen, setSubModalOpen,
    openAreaModal, openFabModal, closeModal,
  } = useApp();

  const [editingTx, setEditingTx]       = useState<Transaction | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { needsInit }   = useWorkDayQuery();
  const addTxMutation   = useAddTransactionMutation();
  const updateTxMutation = useUpdateTransactionMutation();
  const removeTxMutation = useRemoveTransactionMutation();
  const initDayMutation = useInitDayMutation();

  function handleEdit(tx: Transaction) {
    setEditingTx(tx);
    setEditModalOpen(true);
  }

  function handleDelete(id: string) {
    removeTxMutation.mutate(id);
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'trabalho':  return <AreaView areaId="trabalho"  onAdd={() => openAreaModal('trabalho'  as AreaId)} onEdit={handleEdit} onDelete={handleDelete} />;
      case 'casa':      return <AreaView areaId="casa"      onAdd={() => openAreaModal('casa'      as AreaId)} onEdit={handleEdit} onDelete={handleDelete} />;
      case 'aleatorio': return <AreaView areaId="aleatorio" onAdd={() => openAreaModal('aleatorio' as AreaId)} onEdit={handleEdit} onDelete={handleDelete} />;
      case 'estoque':   return <EstoqueView />;
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

      <NovaTransacaoModal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditingTx(null); }}
        onSave={(tx, when) => addTxMutation.mutate({ tx, when })}
        onUpdate={(id, tx, when) => updateTxMutation.mutate({ id, updates: { ...tx, when } })}
        editingTx={editingTx}
        areaFilter={editingTx ? undefined : undefined}
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
