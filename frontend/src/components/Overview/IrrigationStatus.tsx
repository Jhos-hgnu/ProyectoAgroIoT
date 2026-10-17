import React, { useState } from 'react';
import type { PotData } from '../../data/potsData';

interface IrrigationStatusProps {
  pot: PotData;
  isIrrigating: boolean;
}

export const IrrigationStatus: React.FC<IrrigationStatusProps> = ({ pot, isIrrigating }) => {
  const [autoRulesActive, setAutoRulesActive] = useState(true);

  return (
    <div 
      className="p-4 rounded-4 border border-secondary border-opacity-10 h-100 d-flex flex-column justify-content-between shadow-sm"
      style={{ backgroundColor: '#131B2E' }}
    >
      <div>
        {/* ENCABEZADO CON ICONO, TITULO Y SWITCH */}
        <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-secondary border-opacity-10">
          <div className="d-flex align-items-center gap-3">
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center shrink-0"
              style={{ width: '44px', height: '44px', backgroundColor: '#0D1527', color: '#0284C7' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
              </svg>
            </div>
            <div>
              <h6 className="fw-bold text-white mb-0" style={{ fontSize: '15px' }}>
                Subsistema de Riego y Actuador
              </h6>
              <small style={{ fontSize: '11px', color: '#64748B' }}>
                Control directo de microbomba peristáltica 12V
              </small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end">
              <div className="fw-semibold text-white" style={{ fontSize: '11px', lineHeight: '1.2' }}>Auto-Reglas</div>
              <small style={{ fontSize: '10px', color: '#64748B' }}>06:00 • 18:00</small>
            </div>
            <div className="form-check form-switch m-0 p-0 d-flex align-items-center">
              <input 
                className="form-check-input shadow-none ms-0 cursor-pointer" 
                type="checkbox" 
                role="switch"
                checked={autoRulesActive}
                onChange={() => setAutoRulesActive(!autoRulesActive)}
                style={{ 
                  width: '40px', 
                  height: '21px', 
                  backgroundColor: autoRulesActive ? '#10B981' : '#334155',
                  borderColor: 'transparent',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        </div>

        {/* MÉTRICAS CON MEJOR ESPACIADO EN ESTADO BOMBA */}
        <div className="row g-3 mb-4">
          <div className="col-4">
            <div>
              <span className="d-block text-truncate mb-1" style={{ fontSize: '11px', color: '#94A3B8' }}>Estado Bomba</span>
              <span 
                className="fw-bold d-inline-flex align-items-center gap-2 px-1" 
                style={{ fontSize: '13px', color: isIrrigating ? '#38BDF8' : '#10B981' }}
              >
                <span 
                  className="rounded-circle shrink-0" 
                  style={{ 
                    width: '7px', 
                    height: '7px', 
                    backgroundColor: isIrrigating ? '#38BDF8' : '#10B981',
                    boxShadow: isIrrigating ? '0 0 6px #38BDF8' : 'none'
                  }}
                ></span>
                <span className="ms-0.5">{isIrrigating ? 'Bombardeando...' : 'Inactiva • Lista'}</span>
              </span>
            </div>
          </div>

          <div className="col-4">
            <div>
              <span className="d-block text-truncate mb-1" style={{ fontSize: '11px', color: '#94A3B8' }}>Suministrado Hoy</span>
              <span className="fw-bold text-white d-block" style={{ fontSize: '13px' }}>
                {pot.waterDispensed} <small className="fw-normal ms-1" style={{ color: '#64748B' }}>({pot.waterCycles} ciclos)</small>
              </span>
            </div>
          </div>

          <div className="col-4">
            <div>
              <span className="d-block text-truncate mb-1" style={{ fontSize: '11px', color: '#94A3B8' }}>Depósito Reserva</span>
              <span className="fw-bold text-white d-block" style={{ fontSize: '13px' }}>
                {pot.waterReservoir} <small className="fw-semibold ms-1" style={{ color: '#10B981' }}>({pot.reservoirPercent}%)</small>
              </span>
            </div>
          </div>
        </div>

        {/* BARRA DE CAPACIDAD DE AGUA */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ fontSize: '11px' }}>
            <span style={{ color: '#64748B' }}>Nivel del tanque de agua</span>
            <span className="fw-semibold text-success">{pot.reservoirPercent}% Disponible</span>
          </div>
          <div className="progress" style={{ height: '6px', backgroundColor: '#0D1527' }}>
            <div 
              className="progress-bar rounded-pill" 
              role="progressbar" 
              style={{ width: `${pot.reservoirPercent}%`, backgroundColor: '#10B981' }}
            ></div>
          </div>
        </div>
      </div>

      {/* BOTONES CENTRADOS */}
      <div className="row g-2 pt-2 border-top border-secondary border-opacity-10">
        <div className="col-6">
          <button 
            className="btn btn-sm w-100 fw-medium d-flex align-items-center justify-content-center gap-2 border border-secondary border-opacity-25 py-2.5 rounded-3 text-white shadow-sm"
            style={{ backgroundColor: '#1E293B', fontSize: '12px', cursor: 'pointer' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <span>Volumen Personalizado...</span>
          </button>
        </div>

        <div className="col-6">
          <button 
            className="btn btn-sm w-100 fw-medium d-flex align-items-center justify-content-center gap-2 border border-secondary border-opacity-25 py-2.5 rounded-3 shadow-sm"
            style={{ backgroundColor: '#1E293B', color: '#F87171', fontSize: '12px', cursor: 'pointer' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            <span>Bloqueo de Emergencia</span>
          </button>
        </div>
      </div>
    </div>
  );
};