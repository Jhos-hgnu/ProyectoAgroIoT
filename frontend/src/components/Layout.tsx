import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AddPotModal } from './Overview/AddPotModal';
import type { PotData } from '../data/potsData';
import type { DispositivoCrear } from '../types/contrato';
import type { UserProfile } from './SettingsView';
import type { Notificacion } from './NotificationsDropdown';
import type { UseSalud } from '../hooks/useSalud';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedPotId: string;
  onSelectPot: (id: string) => void;
  potsList: PotData[];
  onAddPot: (datos: DispositivoCrear) => Promise<void>;
  profile: UserProfile;
  notificaciones?: Notificacion[];
  esp32Conectado?: boolean | null;
  salud?: UseSalud;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onLogout, 
  activeTab, 
  setActiveTab,
  selectedPotId,
  onSelectPot,
  potsList,
  onAddPot,
  profile,
  notificaciones,
  esp32Conectado,
  salud
}) => {
  const [isAddPotModalOpen, setIsAddPotModalOpen] = useState(false);

  return (
    <div className="d-flex vh-100 w-100 overflow-hidden" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', transition: 'background-color 0.3s ease' }}>
      <Sidebar onLogout={onLogout} activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} esp32Conectado={esp32Conectado} salud={salud} />
      <div className="d-flex flex-column min-w-0" style={{ flex: 1, minHeight: 0, backgroundColor: 'var(--bg-app)', width: '100%', transition: 'background-color 0.3s ease' }}>
        <Topbar 
          selectedPotId={selectedPotId}
          onSelectPot={onSelectPot}
          potsList={potsList}
          onOpenAddPotModal={() => setIsAddPotModalOpen(true)}
          onNavigate={(vista) => setActiveTab(vista)} // Pasa la redirección de notificaciones
          notificacionesLive={notificaciones}
        />
        <main
          className={`p-4 ${activeTab === 'devices' ? 'devices-main' : 'overflow-auto'}`}
          style={{ flex: 1, minHeight: 0 }}
        >
          {children}
        </main>
      </div>

      {isAddPotModalOpen && (
      <AddPotModal 
        isOpen={isAddPotModalOpen} 
        onClose={() => setIsAddPotModalOpen(false)} 
        onAddPot={onAddPot} 
        nextPotNumber={Math.max(0, ...potsList.map((p) => Number(p.number) || 0)) + 1}
      />
      )}
    </div>
  );
};