import { useState } from 'react';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { OverviewView } from './components/Overview/OverviewView';
import { POTS_DATA } from './data/potsData';
import type { PotData } from './data/potsData';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [potsList, setPotsList] = useState<PotData[]>(Object.values(POTS_DATA));
  const [selectedPotId, setSelectedPotId] = useState('01');

  const handleAddPot = (newPot: PotData) => {
    setPotsList(prev => [...prev, newPot]);
    setSelectedPotId(newPot.id);
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Layout 
      onLogout={() => setIsAuthenticated(false)} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      potsList={potsList}
      selectedPotId={selectedPotId}
      onSelectPot={setSelectedPotId}
      onAddPot={handleAddPot}
    >
      {activeTab === 'overview' && (
        <OverviewView
          pot={potsList.find(pot => pot.id === selectedPotId) ?? potsList[0]}
          potsList={potsList}
          selectedPotId={selectedPotId}
          onSelectPot={setSelectedPotId}
        />
      )}

      {activeTab !== 'overview' && (
        <div className="p-4 rounded-3 border border-secondary border-opacity-10" style={{ backgroundColor: '#131B2E' }}>
          <h4 className="fw-bold text-white mb-2">
            {activeTab === 'devices' && 'Gestión de Dispositivos'}
            {activeTab === 'analytics' && 'Analíticas y Telemetría'}
            {activeTab === 'alerts' && 'Centro de Alertas'}
            {activeTab === 'settings' && 'Configuración del Sistema'}
          </h4>
          <p className="text-secondary mb-0" style={{ color: '#94A3B8', fontSize: '14px' }}>
            Esta sección se puede construir según los requerimientos específicos.
          </p>
        </div>
      )}
    </Layout>
  );
}

export default App;