import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AddPotModal } from './Overview/AddPotModal';
import type { PotData } from '../data/potsData';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedPotId: string;
  onSelectPot: (id: string) => void;
  potsList: PotData[];
  onAddPot: (pot: PotData) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onLogout, 
  activeTab, 
  setActiveTab,
  selectedPotId,
  onSelectPot,
  potsList,
  onAddPot
}) => {
  const [isAddPotModalOpen, setIsAddPotModalOpen] = useState(false);

  return (
    <div className="d-flex min-vh-100 w-100" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', transition: 'background-color 0.3s ease' }}>
      <Sidebar onLogout={onLogout} activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="d-flex flex-column min-w-0" style={{ flex: 1, backgroundColor: 'var(--bg-app)', width: '100%', transition: 'background-color 0.3s ease' }}>
        <Topbar 
          selectedPotId={selectedPotId}
          onSelectPot={onSelectPot}
          potsList={potsList}
          onOpenAddPotModal={() => setIsAddPotModalOpen(true)}
        />
        <main className="p-4 overflow-auto" style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      <AddPotModal 
        isOpen={isAddPotModalOpen} 
        onClose={() => setIsAddPotModalOpen(false)} 
        onAddPot={onAddPot} 
        nextPotNumber={potsList.length + 1}
      />
    </div>
  );
};