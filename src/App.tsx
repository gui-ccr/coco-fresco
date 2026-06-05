import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/layout/AppLayout';
import { NovaTransacaoModal } from '@/features/transactions/NovaTransacaoModal';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { AreaView } from '@/features/work/AreaView';
import { SettingsView } from '@/features/settings/SettingsView';
import { RelatorioView } from '@/features/reports/RelatorioView';
import { NotesView } from '@/features/notes/NotesView';
import { EstoqueView } from '@/features/estoque/EstoqueView';
import {
  useAddTransactionMutation,
  useUpdateTransactionMutation,
  useRemoveTransactionMutation,
} from '@/shared/hooks/queries/useTransactionsQuery';
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

  const addTxMutation    = useAddTransactionMutation();
  const updateTxMutation = useUpdateTransactionMutation();
  const removeTxMutation = useRemoveTransactionMutation();

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
      case 'relatorio': return <RelatorioView onSubModalChange={setSubModalOpen} onEdit={handleEdit} onDelete={handleDelete} />;
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

    </>
  );
}

export default App;
