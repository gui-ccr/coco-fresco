import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import type { AreaId } from '@/shared/types/area';

interface AppContextType {
  activeTab:       string;
  setActiveTab:    (tab: string) => void;
  isModalOpen:     boolean;
  modalAreaFilter: AreaId | undefined;
  subModalOpen:    boolean;
  setSubModalOpen: (open: boolean) => void;
  openAreaModal:   (area: AreaId) => void;
  openFabModal:    () => void;
  closeModal:      () => void;
}

const AppContext = createContext<AppContextType>(null!);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab,       setActiveTab]       = useState('dashboard');
  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [modalAreaFilter, setModalAreaFilter] = useState<AreaId | undefined>();
  const [subModalOpen,    setSubModalOpen]    = useState(false);

  const openAreaModal = useCallback((area: AreaId) => {
    setModalAreaFilter(area);
    setIsModalOpen(true);
  }, []);

  const openFabModal = useCallback(() => {
    setModalAreaFilter(undefined);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const value = useMemo(() => ({
    activeTab, setActiveTab,
    isModalOpen, modalAreaFilter,
    subModalOpen, setSubModalOpen,
    openAreaModal, openFabModal, closeModal,
  }), [activeTab, isModalOpen, modalAreaFilter, subModalOpen, openAreaModal, openFabModal, closeModal]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
