import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { NovaTransacaoModal } from '@/components/modals/NovaTransacaoModal';
import { IniciarDiaModal } from '@/components/modals/IniciarDiaModal';
import { DashboardView } from '@/features/dashboard/views/DashboardView';
import { AreaView } from '@/features/work/views/AreaView';
import { SettingsView } from '@/features/settings/views/SettingsView';
import { RelatorioView } from '@/features/reports/views/RelatorioView';
import { useTransactions } from '@/shared/hooks/useTransactions';
import { useSettings } from '@/shared/hooks/useSettings';
import { useWorkDay } from '@/shared/hooks/useWorkDay';

function App() {
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { transactions, addTransaction } = useTransactions();
  const { settings, updateSettings }     = useSettings();
  const { today, allDays, needsInit, loading: dayLoading, initDay } = useWorkDay();

  // Filtra transações para as views de área (todas — não apenas hoje)
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView transactions={transactions} workDay={today} />;
      case 'trabalho':
        return <AreaView areaId="trabalho"  transactions={transactions} />;
      case 'casa':
        return <AreaView areaId="casa"      transactions={transactions} />;
      case 'aleatorio':
        return <AreaView areaId="aleatorio" transactions={transactions} />;
      case 'relatorio':
        return <RelatorioView transactions={transactions} workDays={allDays} />;
      case 'config':
        return <SettingsView settings={settings} updateSettings={updateSettings} />;
      default:
        return <DashboardView transactions={transactions} workDay={today} />;
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
        onSave={addTransaction}
        settings={settings}
        onGoToSettings={() => setActiveTab('config')}
      />

      {/* Modal de início de dia — aparece quando o dia não foi iniciado */}
      {!dayLoading && needsInit && (
        <IniciarDiaModal onConfirm={initDay} />
      )}
    </>
  );
}

export default App;
