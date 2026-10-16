import React, { useState } from 'react';
import { HeaderOverview } from './HeaderOverview';
import { MetricsWidgets } from './MetricsWidgets';
import { IrrigationStatus } from './IrrigationStatus';
import { PotsSummary } from './PotsSummary';
import type { PotData } from '../../data/potsData';

interface OverviewViewProps {
  pot: PotData;
  potsList: PotData[];
  selectedPotId: string;
  onSelectPot: (id: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  pot,
  potsList,
  selectedPotId,
  onSelectPot,
}) => {
  const [isIrrigating, setIsIrrigating] = useState(false);

  const handleIrrigate = () => {
    setIsIrrigating(true);
    setTimeout(() => {
      setIsIrrigating(false);
    }, 3500); 
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Encabezado con estado reactivo */}
      <HeaderOverview pot={pot} isIrrigating={isIrrigating} onIrrigate={handleIrrigate} />

      {/* Widgets de métricas */}
      <MetricsWidgets pot={pot} />

      {/* Riego y resumen de macetas */}
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <IrrigationStatus pot={pot} isIrrigating={isIrrigating} />
        </div>
        <div className="col-12 col-lg-6">
          <PotsSummary
            potsList={potsList}
            selectedPotId={selectedPotId}
            onSelectPot={onSelectPot}
          />
        </div>
      </div>
    </div>
  );
};