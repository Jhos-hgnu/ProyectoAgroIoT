import React from 'react';
import type { PotData } from '../../data/potsData';

interface PotsSummaryProps {
  potsList: PotData[];
  selectedPotId: string;
  onSelectPot: (id: string) => void;
}

const statusLabels: Record<PotData['status'], string> = {
  Optimal: 'Óptimo',
  Stable: 'Estable',
  Deficit: 'Déficit de hidratación',
};

const statusColors: Record<PotData['status'], string> = {
  Optimal: '#10B981',
  Stable: '#94A3B8',
  Deficit: '#F87171',
};

export const PotsSummary: React.FC<PotsSummaryProps> = ({
  potsList,
  selectedPotId,
  onSelectPot,
}) => {
  return (
    <div
      className="p-4 rounded-4 border border-secondary border-opacity-10 h-100 d-flex flex-column justify-content-between shadow-sm"
      style={{ backgroundColor: '#131B2E' }}
    >
      <div>
        <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom border-secondary border-opacity-10">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center shrink-0"
              style={{ width: '44px', height: '44px', backgroundColor: '#0D1527', color: '#10B981' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
            <div>
              <h6 className="fw-bold text-white mb-0" style={{ fontSize: '15px' }}>
                Mapa Resumido de Macetas
              </h6>
              <small style={{ fontSize: '11px', color: '#64748B' }}>
                Selecciona una maceta para ver su información
              </small>
            </div>
          </div>

          <span className="fw-semibold" style={{ fontSize: '12px', color: '#10B981' }}>
            {potsList.length} {potsList.length === 1 ? 'Nodo' : 'Nodos'}
          </span>
        </div>

        <div
          className="d-flex flex-column gap-2.5 overflow-auto pe-1"
          style={{ maxHeight: '165px', scrollbarWidth: 'thin' }}
        >
          {potsList.map((pot) => {
            const isSelected = selectedPotId === pot.id;
            const statusColor = pot.isLoading ? '#64748B' : statusColors[pot.status];
            const statusLabel = pot.isLoading ? 'Conectando…' : statusLabels[pot.status];

            return (
              <button
                key={pot.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectPot(pot.id)}
                className="btn w-100 text-start p-3 rounded-3 d-flex align-items-center justify-content-between shrink-0"
                style={{
                  backgroundColor: isSelected
                    ? 'rgba(16, 185, 129, 0.08)'
                    : pot.status === 'Deficit' ? 'rgba(239, 68, 68, 0.12)' : '#0D1527',
                  border: isSelected ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-3 fw-bold d-flex align-items-center justify-content-center shrink-0"
                    style={{
                      width: '38px',
                      height: '38px',
                      backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.2)' : '#1E293B',
                      color: isSelected ? '#10B981' : statusColor,
                      fontSize: '14px',
                    }}
                  >
                    {pot.number}
                  </div>
                  <div>
                    <div className="fw-bold text-white" style={{ fontSize: '13px' }}>
                      {pot.name}
                    </div>
                    <small style={{ fontSize: '11px', color: isSelected ? '#10B981' : statusColor }}>
                      {isSelected ? 'Nodo seleccionado · ' : (
                        <>
                          {pot.zone ?? (pot.online !== undefined ? 'Sin ubicación' : 'Ubicación pendiente')}
                          {' · '}
                        </>
                      )}
                      {statusLabel}
                    </small>
                  </div>
                </div>

                <div className="text-end ms-2">
                  <div className="fw-bold" style={{ fontSize: '18px', color: statusColor, lineHeight: '1' }}>
                    {pot.soilMoisture === null ? '—' : `${pot.soilMoisture}%`}
                  </div>
                  <small style={{ fontSize: '10px', color: '#94A3B8' }}>Humedad</small>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
