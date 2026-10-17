import React from 'react';
import type { PotData } from '../../data/potsData';

interface MetricsWidgetsProps {
  pot: PotData;
}

export const MetricsWidgets: React.FC<MetricsWidgetsProps> = ({ pot }) => {
  return (
    <div className="row g-3">
      {/* WIDGET 1: Humedad Suelo */}
      <div className="col-12 col-md-6 col-xl-3">
        <div className="p-4 rounded-4 border border-secondary border-opacity-10 h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: '#131B2E' }}>
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2 text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2"><path d="M2 6c.6 0 1.2-.2 1.5-.5L5 4.2c.6-.6 1.4-.9 2.3-.9H12c.9 0 1.7.3 2.3.9l1.5 1.3c.3.3.9.5 1.5.5H22"/><path d="M2 12c.6 0 1.2-.2 1.5-.5L5 10.2c.6-.6 1.4-.9 2.3-.9H12c.9 0 1.7.3 2.3.9l1.5 1.3c.3.3.9.5 1.5.5H22"/><path d="M2 18c.6 0 1.2-.2 1.5-.5L5 16.2c.6-.6 1.4-.9 2.3-.9H12c.9 0 1.7.3 2.3.9l1.5 1.3c.3.3.9.5 1.5.5H22"/></svg>
                <span className="fw-semibold" style={{ fontSize: '14px' }}>Humedad Suelo</span>
              </div>
              <span className="badge rounded-pill fw-semibold" style={{ fontSize: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '4px 8px' }}>
                Seguro: {pot.vwcRange}
              </span>
            </div>

            <div className="d-flex align-items-center justify-content-between my-2">
              <div>
                <div className="d-flex align-items-baseline">
                  <h1 className="fw-bold text-white mb-0" style={{ fontSize: '38px' }}>{pot.soilMoisture}</h1>
                  <span className="fs-5 text-white ms-0.5">%</span>
                </div>
                <div className="d-flex align-items-center gap-1 mt-1" style={{ color: '#10B981', fontSize: '11px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  <span>+3.2% en últimas 24h</span>
                </div>
              </div>

              <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '70px', height: '70px' }}>
                <svg width="70" height="70" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1E293B" strokeWidth="3.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" strokeWidth="3.5" strokeDasharray={`${pot.soilMoisture}, 100`} strokeLinecap="round" />
                </svg>
                <span className="position-absolute fw-bold text-white" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>VWC</span>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary border-opacity-10" style={{ fontSize: '11px', color: '#94A3B8' }}>
            <span>Sonda: Capacitiva v2.1</span>
            <span>Profundidad: 12cm</span>
          </div>
        </div>
      </div>

      {/* WIDGET 2: Temp Aire */}
      <div className="col-12 col-md-6 col-xl-3">
        <div className="p-4 rounded-4 border border-secondary border-opacity-10 h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: '#131B2E' }}>
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2 text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2.2"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>
                <span className="fw-semibold" style={{ fontSize: '14px' }}>Temp Aire</span>
              </div>
              <span className="badge rounded-pill fw-semibold" style={{ fontSize: '10px', backgroundColor: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', padding: '4px 8px' }}>
                Objetivo: 22-26°C
              </span>
            </div>

            <div className="d-flex align-items-center justify-content-between my-2">
              <div>
                <div className="d-flex align-items-baseline">
                  <h1 className="fw-bold text-white mb-0" style={{ fontSize: '38px' }}>{pot.airTemp}</h1>
                  <span className="fs-5 text-white ms-0.5">°C</span>
                </div>
                <div className="d-flex align-items-center gap-2 mt-1" style={{ fontSize: '11px' }}>
                  <span style={{ color: '#38BDF8' }}>Mín {pot.tempMin}°C</span>
                  <span style={{ color: '#64748B' }}>•</span>
                  <span style={{ color: '#F43F5E' }}>Máx {pot.tempMax}°C</span>
                </div>
              </div>

              <div style={{ width: '80px', height: '40px' }}>
                <svg width="80" height="40" viewBox="0 0 80 40" fill="none">
                  <path d="M 5 28 C 25 35, 35 10, 55 12 C 65 13, 70 18, 75 18" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="75" cy="18" r="3" fill="#38BDF8" />
                </svg>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary border-opacity-10" style={{ fontSize: '11px' }}>
            <span style={{ color: '#94A3B8' }}>Sensor: SHT40 Core</span>
            <span className="fw-semibold" style={{ color: '#38BDF8' }}>Equilibrio</span>
          </div>
        </div>
      </div>

      {/* WIDGET 3: Humedad & DPV */}
      <div className="col-12 col-md-6 col-xl-3">
        <div className="p-4 rounded-4 border border-secondary border-opacity-10 h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: '#131B2E' }}>
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2 text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2.2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
                <span className="fw-semibold" style={{ fontSize: '14px' }}>Humedad & DPV</span>
              </div>
              <span className="badge rounded-pill fw-semibold" style={{ fontSize: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '4px 8px' }}>
                DPV Ideal
              </span>
            </div>

            <div className="d-flex align-items-center justify-content-between my-2">
              <div>
                <div className="d-flex align-items-baseline">
                  <h1 className="fw-bold text-white mb-0" style={{ fontSize: '38px' }}>{pot.airHumidity}</h1>
                  <span className="fs-6 text-white ms-1 fw-medium">% RH</span>
                </div>
                <div className="mt-1" style={{ fontSize: '11px', color: '#94A3B8' }}>
                  <span className="text-white fw-semibold">DPV {pot.dpv} kPa</span> <span style={{ color: '#64748B' }}>(Obj 0.8 - 1.1)</span>
                </div>
              </div>

              <div className="d-flex align-items-end gap-1.5" style={{ height: '40px' }}>
                <div className="rounded-1" style={{ width: '8px', height: '18px', backgroundColor: '#1E293B' }}></div>
                <div className="rounded-1" style={{ width: '8px', height: '28px', backgroundColor: '#334155' }}></div>
                <div className="rounded-1" style={{ width: '8px', height: '40px', backgroundColor: '#10B981' }}></div>
                <div className="rounded-1" style={{ width: '8px', height: '32px', backgroundColor: '#10B981' }}></div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary border-opacity-10" style={{ fontSize: '11px' }}>
            <span style={{ color: '#94A3B8' }}>Punto Rocío: 17.4°C</span>
            <span className="fw-semibold" style={{ color: '#10B981' }}>Transpiración Saludable</span>
          </div>
        </div>
      </div>

      {/* WIDGET 4: Exposición Solar */}
      <div className="col-12 col-md-6 col-xl-3">
        <div className="p-4 rounded-4 border border-secondary border-opacity-10 h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: '#131B2E' }}>
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2 text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                <span className="fw-semibold" style={{ fontSize: '14px' }}>Exposición Solar</span>
              </div>
              <span className="badge rounded-pill fw-semibold" style={{ fontSize: '10px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', padding: '4px 8px' }}>
                Medición actual
              </span>
            </div>

            <div className="d-flex align-items-center justify-content-between my-2">
              <div>
                <div className="d-flex align-items-baseline">
                  <h1 className="fw-bold text-white mb-0" style={{ fontSize: '38px' }}>{pot.solarExposure}</h1>
                  <span className="fs-6 ms-1 fw-medium" style={{ color: '#F59E0B' }}>Lux</span>
                </div>
                <div className="d-flex align-items-center gap-1 mt-1" style={{ color: '#10B981', fontSize: '11px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2"/></svg>
                  <span>14.5 hrs Fotoperíodo</span>
                </div>
              </div>

              <div className="position-relative d-flex align-items-end justify-content-center" style={{ width: '70px', height: '38px', overflow: 'hidden' }}>
                <svg width="70" height="70" viewBox="0 0 36 36" style={{ marginTop: '-32px' }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1E293B" strokeWidth="3.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" strokeWidth="3.5" strokeDasharray="42, 100" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary border-opacity-10" style={{ fontSize: '11px' }}>
            <span style={{ color: '#94A3B8' }}>Sensor: BH1750 Alta Res</span>
            <span className="fw-semibold" style={{ color: '#10B981' }}>Espectro Completo</span>
          </div>
        </div>
      </div>
    </div>
  );
};