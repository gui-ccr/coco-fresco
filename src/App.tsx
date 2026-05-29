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

function App() {
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { transactions, addTransaction } = useTransactions();
  const { settings, updateSettings }     = useSettings();
  const { today, allDays, needsInit, loading: dayLoading, initDay } = useWorkDay();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView transactions={transactions} workDay={today} />;
      case 'trabalho':  return <AreaView areaId="trabalho"  transactions={transactions} onAdd={() => setIsModalOpen(true)} />;
      case 'casa':      return <AreaView areaId="casa"      transactions={transactions} onAdd={() => setIsModalOpen(true)} />;
      case 'aleatorio': return <AreaView areaId="aleatorio" transactions={transactions} onAdd={() => setIsModalOpen(true)} />;
      case 'relatorio': return <RelatorioView transactions={transactions} workDays={allDays} />;
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
        onOpenModal={() => setIsModalOpen(true)}
      >
        {renderContent()}
      </AppLayout>

      <NovaTransacaoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(tx, when) => addTransaction(tx, when)}
        settings={settings}
        onGoToSettings={() => setActiveTab('config')}
      />

      {!dayLoading && needsInit && (
        <IniciarDiaModal onConfirm={initDay} />
      )}
    </>
  );
}

export default App;
