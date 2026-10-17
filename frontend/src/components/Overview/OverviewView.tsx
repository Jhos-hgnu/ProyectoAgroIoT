import React, { useState } from 'react';
import { HeaderOverview } from './HeaderOverview';
import { MetricsWidgets } from './MetricsWidgets';
import { IrrigationStatus } from './IrrigationStatus';
import { PotsSummary } from './PotsSummary';
import type { PotData } from '../../data/potsData';
import type { UseMaceta } from '../../hooks/useMaceta';

interface OverviewViewProps {
  pot: PotData;
  potsList: PotData[];
  selectedPotId: string;
  onSelectPot: (id: string) => void;
  live?: UseMaceta;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  pot,
  potsList,
  selectedPotId,
  onSelectPot,
  live,
}) => {
  const [isIrrigating, setIsIrrigating] = useState(false);

  const latestRiegoEnCurso = live?.riego?.estado === 'PENDIENTE' || live?.riego?.estado === 'ENVIADO';
  const riegoEnCurso = live
    ? live.solicitandoRiego || latestRiegoEnCurso
    : isIrrigating;

  const handleIrrigate = () => {
    if (live) {
      void live.regar();
      return;
    }
    setIsIrrigating(true);
    setTimeout(() => {
      setIsIrrigating(false);
    }, 3500); 
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Encabezado con estado reactivo */}
      <HeaderOverview
        pot={pot}
        isIrrigating={riegoEnCurso}
        onIrrigate={handleIrrigate}
        live={live}
      />

      {live?.error && (
        <div className="alert alert-warning mb-0" role="alert">
          {live.error}
        </div>
      )}

      {/* Widgets de métricas */}
      <MetricsWidgets pot={pot} sensores={live?.sensores} />

      {/* Riego y resumen de macetas */}
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <IrrigationStatus
            pot={pot}
            isIrrigating={riegoEnCurso}
            live={live ? { riego: live.riego, tieneBomba: live.tieneBomba } : undefined}
          />
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