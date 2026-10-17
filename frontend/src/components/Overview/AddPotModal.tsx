import React, { useState } from 'react';
import type { PotData } from '../../data/potsData';

interface AddPotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPot: (newPotData: PotData) => void;
  nextPotNumber: number;
}

export const AddPotModal: React.FC<AddPotModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddPot, 
  nextPotNumber 
}) => {
  const formattedNumber = nextPotNumber.toString().padStart(2, '0');
  const autoSensorId = `ESP32-NODE-${formattedNumber}`;

  const [crop, setCrop] = useState('');
  const [zone, setZone] = useState('ZONA A');
  const [sector, setSector] = useState('SECTOR #1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop.trim()) return;

    onAddPot({
      id: formattedNumber,
      number: formattedNumber,
      name: `Maceta ${formattedNumber} — ${crop.trim()}`,
      crop: crop.trim(),
      zone: zone,
      sector: sector,
      battery: '100% (Nueva Conexión)',
      soilMoisture: 65,
      vwcRange: '60-80%',
      airTemp: 24.0,
      tempMin: 18.0,
      tempMax: 28.0,
      airHumidity: 60,
      dpv: 1.0,
      solarExposure: '40.0k',
      waterDispensed: '0.00 Litros',
      waterCycles: 0,
      waterReservoir: '5.0L / 5.0L',
      reservoirPercent: 100,
      status: 'Optimal',
    });

    setCrop('');
    onClose();
  };

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      onClick={onClose}
      style={{ 
        backgroundColor: 'rgba(5, 10, 20, 0.75)', 
        zIndex: 1050, 
        backdropFilter: 'blur(4px)',
        cursor: 'pointer'
      }}
    >
      <div 
        className="w-100 mx-3 rounded-4 border border-secondary border-opacity-25 shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', backgroundColor: '#131B2E', color: '#FFFFFF', cursor: 'default' }}
      >
        {/* ENCABEZADO */}
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom border-secondary border-opacity-10">
          <div className="d-flex align-items-center gap-3">
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center shrink-0"
              style={{ width: '40px', height: '40px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <div>
              <h6 className="fw-bold text-white mb-0" style={{ fontSize: '16px' }}>
                Agregar Nueva Maceta
              </h6>
              <small style={{ fontSize: '11px', color: '#94A3B8' }}>
                Registro correlativo para el invernadero
              </small>
            </div>
          </div>

          <button 
            type="button" 
            className="btn p-1 text-secondary shadow-none border-0" 
            onClick={onClose}
            style={{ cursor: 'pointer' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 d-flex flex-column gap-3">
            {/* INYECCIÓN DE ESTILO PARA PLACEHOLDER LEGIBLE */}
            <style>{`
              .custom-input::placeholder {
                color: #94A3B8 !important;
                opacity: 1 !important;
              }
            `}</style>

            <div className="row g-3">
              <div className="col-4">
                <label className="form-label fw-semibold mb-1" style={{ fontSize: '11px', color: '#CBD5E1' }}>
                  Nº MACETA
                </label>
                <input 
                  type="text" 
                  className="form-control text-success fw-bold border-secondary border-opacity-25 shadow-none text-center"
                  value={formattedNumber}
                  disabled
                  style={{ backgroundColor: '#0D1527', fontSize: '14px', cursor: 'not-allowed' }}
                />
              </div>

              <div className="col-8">
                <label className="form-label fw-semibold mb-1" style={{ fontSize: '11px', color: '#CBD5E1' }}>
                  CULTIVO / PLANTA *
                </label>
                <input 
                  type="text" 
                  className="form-control custom-input text-white border-secondary border-opacity-25 shadow-none"
                  placeholder="Ej. Lechuga Hidropónica"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  style={{ 
                    backgroundColor: '#0D1527', 
                    fontSize: '13px'
                  }}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-6">
                <label className="form-label fw-semibold mb-1" style={{ fontSize: '11px', color: '#CBD5E1' }}>
                  ZONA
                </label>
                <select 
                  className="form-select text-white border-secondary border-opacity-25 shadow-none cursor-pointer"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  style={{ backgroundColor: '#0D1527', fontSize: '13px' }}
                >
                  <option value="ZONA A">ZONA A</option>
                  <option value="ZONA B">ZONA B</option>
                  <option value="ZONA C">ZONA C</option>
                </select>
              </div>

              <div className="col-6">
                <label className="form-label fw-semibold mb-1" style={{ fontSize: '11px', color: '#CBD5E1' }}>
                  SECTOR
                </label>
                <select 
                  className="form-select text-white border-secondary border-opacity-25 shadow-none cursor-pointer"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  style={{ backgroundColor: '#0D1527', fontSize: '13px' }}
                >
                  <option value="SECTOR #1">SECTOR #1</option>
                  <option value="SECTOR #2">SECTOR #2</option>
                  <option value="SECTOR #3">SECTOR #3</option>
                  <option value="SECTOR #4">SECTOR #4</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label fw-semibold mb-1" style={{ fontSize: '11px', color: '#CBD5E1' }}>
                ID DISPOSITIVO ESP32 (ASIGNADO AUTOMÁTICAMENTE)
              </label>
              <input 
                type="text" 
                className="form-control text-secondary border-secondary border-opacity-25 shadow-none"
                value={autoSensorId}
                disabled
                style={{ backgroundColor: '#0D1527', fontSize: '12.5px', cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div className="p-4 pt-2 border-top border-secondary border-opacity-10">
            <button 
              type="submit" 
              className="btn w-100 py-2.5 fw-semibold text-white border-0 rounded-3 shadow-sm"
              style={{ backgroundColor: '#10B981', fontSize: '13px', cursor: 'pointer' }}
            >
              Guardar Maceta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};