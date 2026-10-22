import { useState } from 'react';
import type { PotData } from '../data/potsData';

interface DevicesViewProps {
  potsList: PotData[];
  onAddPot: (newPot: PotData) => void;
  selectedPotId: string;
  onSelectPot: (potId: string) => void;
}

export function DevicesView({ potsList, selectedPotId, onSelectPot }: DevicesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');
  const [flashLed, setFlashLed] = useState(false);
  const [buzzer, setBuzzer] = useState(false);

  // Estado para edición directa de calibración
  const [isEditingCalibration, setIsEditingCalibration] = useState(false);
  const [pumpCalibValue, setPumpCalibValue] = useState('11.3');

  const selectedPot = potsList.find((p) => p.id === selectedPotId) || potsList[0];

  const filteredPots = potsList.filter((pot) => {
    const matchesSearch =
      pot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pot.crop && pot.crop.toLowerCase().includes(searchTerm.toLowerCase())) ||
      pot.number.includes(searchTerm);

    const isOnline = !pot.isLoading;
    if (filterStatus === 'ONLINE') return matchesSearch && isOnline;
    if (filterStatus === 'OFFLINE') return matchesSearch && !isOnline;
    return matchesSearch;
  });

  const totalNodes = potsList.length;
  const onlineNodes = potsList.filter((p) => !p.isLoading).length;

  return (
    <div className="devices-view d-flex flex-column gap-3 text-white">
      {/* ENCABEZADO CON TÍTULO Y BUSCADOR/FILTROS INTEGRADOS A LA DERECHA */}
      <div className="devices-header d-flex flex-wrap align-items-center justify-content-between gap-3 mb-2">
        <div>
          <h3 className="fw-bold text-white mb-1">Gestión de Dispositivos</h3>
          <p className="text-secondary mb-0" style={{ color: '#94a3b8', fontSize: '14px' }}>
            Inventario de nodos hardware, diagnóstico de red y calibración de actuadores
          </p>
        </div>

        {/* TOOLBAR AL LADO DEL TÍTULO */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <div className="position-relative" style={{ width: '280px' }}>
            <span className="position-absolute top-50 start-0 translate-middle-y ms-3 d-flex align-items-center pointer-events-none">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary" style={{ opacity: 0.9 }}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <style>{`
              .custom-search-input::placeholder {
                color: var(--text-secondary) !important;
                opacity: 0.8 !important;
              }
            `}</style>
            <input
              type="text"
              className="form-control text-white ps-5 custom-search-input"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '20px',
                fontSize: '13px',
                height: '36px',
                color: 'var(--input-text)',
              }}
              placeholder="Buscar maceta, cultivo o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="btn btn-sm px-3 py-1 text-white"
              style={{
                borderRadius: '20px',
                backgroundColor: filterStatus === 'ALL' ? '#0284C7' : 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontSize: '12px',
                height: '36px',
              }}
              onClick={() => setFilterStatus('ALL')}
            >
              Todos
            </button>
            <button
              type="button"
              className="btn btn-sm px-3 py-1 text-white"
              style={{
                borderRadius: '20px',
                backgroundColor: filterStatus === 'ONLINE' ? '#0284C7' : 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontSize: '12px',
                height: '36px',
              }}
              onClick={() => setFilterStatus('ONLINE')}
            >
              En línea
            </button>
            <button
              type="button"
              className="btn btn-sm px-3 py-1 text-white"
              style={{
                borderRadius: '20px',
                backgroundColor: filterStatus === 'OFFLINE' ? '#0284C7' : 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontSize: '12px',
                height: '36px',
              }}
              onClick={() => setFilterStatus('OFFLINE')}
            >
              Offline
            </button>
          </div>
        </div>
      </div>

      {/* 1. WIDGETS SUPERIORES */}
      <div className="devices-widgets row g-3">
        {/* Widget 1: Nodos Registrados */}
        <div className="col-12 col-md-3">
          <div className="device-widget-card p-3 rounded-3 border border-secondary border-opacity-25" style={{ backgroundColor: '#131B2E' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white opacity-75">
                  <rect x="2" y="2" width="8" height="8" rx="2" />
                  <rect x="14" y="2" width="8" height="8" rx="2" />
                  <rect x="2" y="14" width="8" height="8" rx="2" />
                  <rect x="14" y="14" width="8" height="8" rx="2" />
                </svg>
                <span className="text-white small fw-bold" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>NODOS REGISTRADOS</span>
              </div>
              <svg width="60" height="38" viewBox="0 0 60 38" fill="none">
                <rect x="2" y="18" width="8" height="18" rx="2" fill="#10B981" />
                <rect x="14" y="10" width="8" height="26" rx="2" fill="#10B981" />
                <rect x="26" y="22" width="8" height="14" rx="2" fill="#64748B" />
                <rect x="38" y="4" width="8" height="32" rx="2" fill="#10B981" />
                <rect x="50" y="12" width="8" height="24" rx="2" fill="#10B981" />
              </svg>
            </div>
            <div className="fs-3 fw-bold text-white mb-2">{totalNodes} Nodos</div>
            <div className="device-widget-footer pt-2 border-top border-secondary border-opacity-25 small text-secondary" style={{ fontSize: '12px' }}>
              {onlineNodes} En línea • {totalNodes - onlineNodes} Offline
            </div>
          </div>
        </div>

        {/* Widget 2: Señal Mesh */}
        <div className="col-12 col-md-3">
          <div className="device-widget-card p-3 rounded-3 border border-secondary border-opacity-25" style={{ backgroundColor: '#131B2E' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white opacity-75">
                  <path d="M5 12.55a11 11 0 0 1 14 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
                <span className="text-white small fw-bold" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>SEÑAL MESH (RSSI)</span>
              </div>
              <svg width="70" height="38" viewBox="0 0 70 38" fill="none">
                <path d="M2 28 L18 20 L34 26 L50 8 L68 16" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="68" cy="16" r="3" fill="#38BDF8" />
              </svg>
            </div>
            <div className="fs-3 fw-bold text-white mb-2">-62 dBm</div>
            <div className="device-widget-footer pt-2 border-top border-secondary border-opacity-25 small text-secondary" style={{ fontSize: '12px' }}>
              Latencia: 42ms (Óptima)
            </div>
          </div>
        </div>

        {/* Widget 3: Firmware Flota (Cambiado de amarillo a Cian/Azul) */}
        <div className="col-12 col-md-3">
          <div className="device-widget-card p-3 rounded-3 border border-secondary border-opacity-25" style={{ backgroundColor: '#131B2E' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white opacity-75">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-white small fw-bold" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>FIRMWARE FLOTA</span>
              </div>
              <svg width="38" height="38" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#334155" strokeWidth="5" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#38BDF8" strokeWidth="5" strokeDasharray="80, 100" />
              </svg>
            </div>
            <div className="fs-3 fw-bold text-white mb-2">v1.2.0</div>
            <div className="device-widget-footer pt-2 border-top border-secondary border-opacity-25 small text-secondary" style={{ fontSize: '12px' }}>
              Estado: Sincronizado
            </div>
          </div>
        </div>

        {/* Widget 4: Firebase RTDB */}
        <div className="col-12 col-md-3">
          <div className="device-widget-card p-3 rounded-3 border border-secondary border-opacity-25" style={{ backgroundColor: '#131B2E' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white opacity-75">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
                <span className="text-white small fw-bold" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>FIREBASE RTDB</span>
              </div>
              <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '26px', height: '26px' }}>
                <span className="position-absolute w-100 h-100 rounded-circle bg-success opacity-25 animate-ping"></span>
                <span className="position-relative rounded-circle bg-success" style={{ width: '12px', height: '12px' }}></span>
              </div>
            </div>
            <div className="fs-3 fw-bold text-white mb-2">120 ms</div>
            <div className="device-widget-footer pt-2 border-top border-secondary border-opacity-25 small text-secondary" style={{ fontSize: '12px' }}>
              Websockets: Conectado
            </div>
          </div>
        </div>
      </div>

      {/* 2. INVENTARIO & INSPECTOR */}
      <div className="devices-lower-row row g-4 align-items-stretch mt-1">
        {/* TABLA DE INVENTARIO HARDWARE (IZQUIERDA) */}
        <div className="col-12 col-lg-7 d-flex flex-column">
          <div className="inventory-panel p-4 rounded-3 border border-secondary border-opacity-10 h-100 d-flex flex-column" style={{ backgroundColor: '#131B2E', minHeight: '380px' }}>
            <div className="d-flex align-items-center gap-3 mb-4 pb-2 border-bottom border-secondary border-opacity-25">
              <div className="p-2 rounded-2 border border-white border-opacity-25 d-flex align-items-center justify-content-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div>
                <h6 className="fw-bold m-0 text-white fs-6">Inventario de Nodos Registrados</h6>
                <span className="small text-secondary" style={{ fontSize: '12px' }}>ESP32 SoC Network</span>
              </div>
            </div>

            <div className="table-responsive inventory-table-scroll">
              <table className="table table-dark table-hover inventory-table align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
                <thead>
                  <tr className="text-secondary small border-bottom border-secondary border-opacity-25" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                    <th className="bg-transparent border-0">DISPOSITIVO / SOC</th>
                    <th className="bg-transparent border-0">DIRECCIÓN IP / MAC</th>
                    <th className="bg-transparent border-0">ESTADO & RSSI</th>
                    <th className="bg-transparent border-0">ALIMENTACIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPots.map((pot) => {
                    const isSelected = pot.id === selectedPotId;
                    const isOnline = !pot.isLoading;

                    return (
                      <tr
                        key={pot.id}
                        onClick={() => onSelectPot(pot.id)}
                        style={{ cursor: 'pointer', backgroundColor: isSelected ? '#1E293B' : 'transparent' }}
                        className={`border-bottom border-secondary border-opacity-10${isSelected ? ' inventory-row-selected' : ''}`}
                      >
                        <td className="bg-transparent border-0 py-3">
                          <div className="fw-bold text-white" style={{ fontSize: '14px' }}>{pot.name}</div>
                          <div className="small text-secondary" style={{ fontSize: '12px' }}>
                            ID: #ESP32-M{pot.number} — {pot.zone || 'ZONA A'}
                          </div>
                        </td>
                        <td className="bg-transparent border-0 py-3">
                          <div className="text-info small fw-bold">192.168.1.10{pot.number}</div>
                          <div className="small text-secondary font-monospace" style={{ fontSize: '11px' }}>
                            A4:CF:12:89:55:0{pot.number}
                          </div>
                        </td>
                        <td className="bg-transparent border-0 py-3" style={{ minWidth: '140px' }}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small" style={{ fontSize: '11px', color: isOnline ? '#10B981' : '#64748B' }}>
                              {isOnline ? 'En línea' : 'Desconectado'}
                            </span>
                            <span className="small text-secondary" style={{ fontSize: '11px' }}>
                              {isOnline ? '-58 dBm' : '0 dBm'}
                            </span>
                          </div>
                          <div className="progress" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{
                                width: isOnline ? '85%' : '0%',
                                backgroundColor: isOnline ? '#10B981' : '#64748B',
                                borderRadius: '2px',
                              }}
                            ></div>
                          </div>
                        </td>
                        <td className="bg-transparent border-0 py-3">
                          <div className="small fw-semibold text-white">{pot.battery || '92% (Red)'}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PANEL INSPECTOR MACETA (DERECHA) */}
        <div className="col-12 col-lg-5 d-flex flex-column">
          {selectedPot ? (
            <div className="p-4 rounded-3 border border-secondary border-opacity-10 h-100 d-flex flex-column gap-3" style={{ backgroundColor: '#131B2E', minHeight: '380px' }}>
              
              {/* ENCABEZADO */}
              <div className="d-flex justify-content-between align-items-center pb-3 border-bottom border-secondary border-opacity-25">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded border border-white border-opacity-25 d-flex align-items-center justify-content-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                    </svg>
                  </div>
                  <div>
                    <h6 className="fw-bold m-0 text-white" style={{ fontSize: '15px' }}>{selectedPot.name}</h6>
                    <span className="small text-secondary" style={{ fontSize: '11px' }}>ID Hardware: #ESP32-M{selectedPot.number}</span>
                  </div>
                </div>
                <span className={`badge ${!selectedPot.isLoading ? 'bg-success' : 'bg-secondary'} px-2 py-1`}>
                  {!selectedPot.isLoading ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* IDENTIFICACIÓN FÍSICA EN INVERNADERO */}
              <div>
                <label className="form-label text-secondary small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                  IDENTIFICACIÓN FÍSICA EN INVERNADERO
                </label>
                <p className="small text-secondary mb-3" style={{ fontSize: '12px', color: '#94A3B8' }}>
                  Acciona los actuadores visuales o sonoros para identificar físicamente la placa dentro del bancal.
                </p>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm flex-fill text-white border border-white border-opacity-25 py-2"
                    style={{
                      borderRadius: '8px',
                      backgroundColor: flashLed ? '#0284C7' : 'rgba(255, 255, 255, 0.05)',
                      fontSize: '12px',
                    }}
                    onClick={() => setFlashLed(!flashLed)}
                  >
                    {flashLed ? 'Parpadeando LED...' : 'Flash Board LED'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm flex-fill text-white border border-white border-opacity-25 py-2"
                    style={{
                      borderRadius: '8px',
                      backgroundColor: buzzer ? '#0284C7' : 'rgba(255, 255, 255, 0.05)',
                      fontSize: '12px',
                    }}
                    onClick={() => setBuzzer(!buzzer)}
                  >
                    {buzzer ? 'Sonando Buzzer...' : 'Sound Buzzer'}
                  </button>
                </div>
              </div>

              {/* CALIBRACIÓN DE SENSORES */}
              <div className="pt-3 border-top border-secondary border-opacity-25">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label text-secondary small fw-bold text-uppercase m-0" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                    CALIBRACIÓN DE SENSORES
                  </label>
                  {!isEditingCalibration ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light calibration-edit-button py-1 px-3"
                      style={{ fontSize: '11px', borderRadius: '6px' }}
                      onClick={() => setIsEditingCalibration(true)}
                    >
                      Editar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-success calibration-edit-button py-1 px-3"
                      style={{ fontSize: '11px', borderRadius: '6px' }}
                      onClick={() => setIsEditingCalibration(false)}
                    >
                      Guardar
                    </button>
                  )}
                </div>

                <div className="d-flex flex-column gap-2">
                  {/* Item 1: Sensor Capacitivo */}
                  <div className="p-3 rounded-2 border border-white border-opacity-10" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="small text-white fw-medium" style={{ fontSize: '13px' }}>Sensor Capacitivo (Suelo)</span>
                      <span className="small text-success fw-bold" style={{ fontSize: '13px' }}>{selectedPot.soilMoisture !== null ? `${selectedPot.soilMoisture}%` : 'N/A'}</span>
                    </div>
                    {isEditingCalibration && (
                      <div className="small text-secondary border-top border-secondary border-opacity-25 pt-2 mt-2" style={{ fontSize: '11px' }}>
                        * Coloque la sonda al aire seco (0%) y sumergida en agua (100%) para autocalibrar.
                      </div>
                    )}
                  </div>

                  {/* Item 2: Bomba Peristáltica */}
                  <div className="p-3 rounded-2 border border-white border-opacity-10" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="small text-white fw-medium" style={{ fontSize: '13px' }}>Bomba de Riego (Peristáltica)</span>
                      {!isEditingCalibration ? (
                        <span className="small text-info fw-bold" style={{ fontSize: '13px' }}>{pumpCalibValue} ml/10s</span>
                      ) : (
                        <div className="d-flex align-items-center gap-1">
                          <input
                            type="number"
                            className="form-control text-white text-center border-white border-opacity-25 py-0 px-1"
                            style={{ backgroundColor: '#0A0F1D', width: '60px', height: '26px', fontSize: '12px' }}
                            value={pumpCalibValue}
                            onChange={(e) => setPumpCalibValue(e.target.value)}
                          />
                          <span className="small text-secondary" style={{ fontSize: '11px' }}>ml/10s</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-3 text-secondary">Selecciona un dispositivo para inspeccionar.</div>
          )}
        </div>
      </div>
    </div>
  );
}