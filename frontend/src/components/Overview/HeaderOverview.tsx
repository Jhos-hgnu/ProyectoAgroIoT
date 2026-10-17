import React from 'react';
import type { PotData } from '../../data/potsData';

interface HeaderOverviewProps {
  pot: PotData;
  isIrrigating: boolean;
  onIrrigate: () => void;
}

export const HeaderOverview: React.FC<HeaderOverviewProps> = ({ pot, isIrrigating, onIrrigate }) => {
  return (
    <div 
      className="p-4 rounded-4 border border-secondary border-opacity-10 shadow-sm"
      style={{ backgroundColor: '#131B2E' }}
    >
      {/* FILA 1: Ícono, Nombre de la Maceta y Badge de Zona */}
      <div className="d-flex align-items-center gap-3">
        <div className="position-relative shrink-0">
          <div 
            className="rounded-3 d-flex align-items-center justify-content-center"
            style={{ width: '50px', height: '50px', backgroundColor: '#0D1527' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 10v10M12 10a4 4 0 0 1 4-4h3v3a4 4 0 0 1-4 4h-3zM12 14a4 4 0 0 0-4-4H5v3a4 4 0 0 0 4 4h3z"/>
            </svg>
          </div>
          
          <span 
            className="position-absolute rounded-circle border border-dark" 
            style={{ 
              top: '-2px', 
              right: '-2px', 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#10B981',
              boxShadow: '0 0 8px #10B981',
              animation: 'spinner-grow 1.5s infinite linear'
            }}
          ></span>
        </div>

        <div className="d-flex align-items-center gap-3 flex-wrap">
          <h3 className="fw-bold text-white mb-0" style={{ letterSpacing: '-0.3px' }}>
            {pot.name}
          </h3>
          <span 
            className="badge rounded-pill fw-semibold border border-success border-opacity-25 ms-1" 
            style={{ fontSize: '11px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '6px 12px' }}
          >
            {pot.zone} • {pot.sector}
          </span>
        </div>
      </div>

      {/* FILA 2: Metadatos y Botones */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mt-3.5 pt-3 border-top border-secondary border-opacity-10">
        <div className="d-flex align-items-center gap-3 flex-wrap" style={{ fontSize: '13px', color: '#94A3B8' }}>
          <span className="d-flex align-items-center gap-2" style={{ color: '#10B981' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="16" height="10" rx="2"/>
              <line x1="22" y1="11" x2="22" y2="13"/>
              <line x1="6" y1="11" x2="6" y2="13"/>
              <line x1="10" y1="11" x2="10" y2="13"/>
            </svg>
            {pot.battery}
          </span>
          <span style={{ color: '#334155' }}>•</span>
          <span className="d-flex align-items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            Sincronizado hace 12s
          </span>
        </div>

        <div className="d-flex align-items-center gap-3 flex-wrap">
          {/* BOTÓN DOSIS MANUAL CON EVENTO ONCLICK Y ESTADO ACTIVO */}
          <button 
            type="button"
            className="btn btn-sm fw-semibold d-flex align-items-center gap-2 border-0 px-3.5 py-2.5 rounded-3 text-white shadow-sm"
            style={{ 
              backgroundColor: isIrrigating ? '#0284C7' : '#0284C7', 
              fontSize: '13px',
              cursor: isIrrigating ? 'not-allowed' : 'pointer',
              opacity: isIrrigating ? 0.8 : 1
            }}
            onClick={onIrrigate}
            disabled={isIrrigating}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
            </svg>
            <span>{isIrrigating ? 'Regando...' : 'Dosis Manual 100ml'}</span>
          </button>

          <button 
            type="button"
            className="btn btn-sm fw-medium d-flex align-items-center gap-2 border border-secondary border-opacity-25 px-3.5 py-2.5 rounded-3 text-white shadow-sm"
            style={{ backgroundColor: '#1E293B', fontSize: '13px', cursor: 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Configurar Horario</span>
          </button>

          <button 
            type="button"
            className="btn btn-sm fw-medium d-flex align-items-center gap-2 border border-secondary border-opacity-25 px-3.5 py-2.5 rounded-3 text-white shadow-sm"
            style={{ backgroundColor: '#1E293B', fontSize: '13px', cursor: 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};