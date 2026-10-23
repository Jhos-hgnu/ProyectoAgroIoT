import React, { useState } from 'react';
import { HeaderOverview } from './HeaderOverview';
import { MetricsWidgets } from './MetricsWidgets';
import { IrrigationStatus } from './IrrigationStatus';
import { PotsSummary } from './PotsSummary';
import type { PotData } from '../../data/potsData';
import type { UseMaceta } from '../../hooks/useMaceta';
import { useReportes } from '../../hooks/useReportes';
import type { Reporte } from '../../types/contrato';
import { riegoAbierto } from '../../data/adaptador';
import { useTanque } from '../../hooks/useTanque';
import { ConfigRiegoModal } from './ConfigRiegoModal';
import { ReportePreviewModal } from './ReportePreviewModal';

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
  const reportes = useReportes(live?.dispositivo?.id);
  const [configAbierta, setConfigAbierta] = useState(false);
  const tanque = useTanque(live?.dispositivo?.id ?? 'maceta-01', live?.riegos ?? []);

  const [reporteVisible, setReporteVisible] = useState<Reporte | null>(null);

  // Se genera el reporte y se muestra; el PDF se descarga desde la vista previa.
  const handleExport = async () => {
    const reporte = await reportes.generar(24);
    if (reporte) setReporteVisible(reporte);
  };

  const latestRiegoEnCurso = riegoAbierto(live?.riego);
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
        onExport={live ? () => void handleExport() : undefined}
        isExporting={reportes.generando}
        onConfigure={live?.dispositivo ? () => setConfigAbierta(true) : undefined}
      />

      {configAbierta && live?.dispositivo && (
        <ConfigRiegoModal
          dispositivo={live.dispositivo}
          guardando={live.guardandoConfig}
          onClose={() => setConfigAbierta(false)}
          onGuardar={live.actualizarConfig}
          tanque={tanque}
        />
      )}

      {reporteVisible && (
        <ReportePreviewModal
          reporte={reporteVisible}
          nombreMaceta={pot.name}
          onClose={() => setReporteVisible(null)}
        />
      )}

      {live?.error && (
        <div className="alert alert-warning mb-0" role="alert">
          {live.error}
        </div>
      )}

      {live && latestRiegoEnCurso && !live.conectado && (
        <div className="alert alert-info mb-0" role="status">
          Riego registrado en la API. La maceta está desconectada: lo ejecutará en cuanto se conecte y envíe su
          próxima lectura. Si no lo confirma en 2 minutos, quedará como "no confirmado" y podrás volver a regar.
        </div>
      )}

      {live && reportes.generando && (
        <div className="alert alert-info mb-0" role="status">
          Generando el reporte con IA de las últimas 24 h… puede tardar unos segundos.
        </div>
      )}

      {live && reportes.error && (
        <div className="alert alert-warning mb-0 d-flex justify-content-between align-items-center gap-2" role="alert">
          <span>{reportes.error}</span>
          <button type="button" className="btn-close" aria-label="Cerrar" onClick={reportes.limpiarError}></button>
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
            live={live ? {
              riego: live.riego,
              tieneBomba: live.tieneBomba,
              dispositivo: live.dispositivo,
              guardandoConfig: live.guardandoConfig,
              regar: live.regar,
              actualizarConfig: live.actualizarConfig,
              tanque,
            } : undefined}
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