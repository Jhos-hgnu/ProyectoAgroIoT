import { useState, useEffect } from 'react';
import { api } from '../api/cliente';
import type { PotData } from '../data/potsData';
import type { ConsultaMediciones } from '../types/contrato';

interface AnalyticsViewProps {
  potsList: PotData[];
  selectedPotId: string;
  onSelectPot: (potId: string) => void;
}

export function AnalyticsView({ potsList, selectedPotId, onSelectPot }: AnalyticsViewProps) {
  // Estado local para la maceta seleccionada mediante los botones de la derecha
  const [activePotId, setActivePotId] = useState<string>(selectedPotId);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(false);

  // Sincronizar si cambia el selector global de la Topbar
  useEffect(() => {
    setActivePotId(selectedPotId);
  }, [selectedPotId]);

  // Maceta actualmente activa
  const currentPot = potsList.find((p) => p.id === activePotId) ?? potsList[0];

  const [metricas, setMetricas] = useState({
    humedadProm: 58.4,
    aguaTotal: 1.45,
    tempProm: 24.2,
    riegosTotales: 12,
  });

  // Efecto para cargar datos de la maceta seleccionada
  useEffect(() => {
    async function cargarDatos() {
      setLoading(true);
      try {
        const agrupacionValor = (timeRange === '24h' ? '1h' : '1d') as NonNullable<
          ConsultaMediciones['agrupacion']
        >;

        const datos = await api.mediciones(`ESP32-M${activePotId.padStart(2, '0')}`, {
          agrupacion: agrupacionValor,
        });

        if (datos && Array.isArray(datos) && datos.length > 0) {
          const sumaHumedad = datos.reduce((acc, curr) => acc + (curr.humedadSuelo ?? 0), 0);
          setMetricas((prev) => ({
            ...prev,
            humedadProm: Number((sumaHumedad / datos.length).toFixed(1)),
          }));
        }
      } catch (err) {
        console.warn('Usando datos de respaldo para el análisis:', err);
      } finally {
        setLoading(false);
      }
    }
    cargarDatos();
  }, [activePotId, timeRange]);

  return (
    <div className="analytics-view d-flex flex-column gap-4">
      {/* Encabezado */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h3 className="fw-bold mb-1">Análisis e Histórico</h3>
          <p className="mb-0 text-secondary" style={{ fontSize: '14px' }}>
            Monitoreo comparativo, tendencias microclimáticas y rendimiento de riego
          </p>
        </div>

        {/* Filtro de Rango Temporal */}
        <div className="d-flex gap-2" role="group">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              type="button"
              className={`btn analytics-range-button${timeRange === range ? ' is-active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas KPI de Rendimiento */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-75" aria-hidden="true">
                <path d="M12 3v12" />
                <path d="M8 11.5a4 4 0 1 0 8 0c0-2.2-4-8.5-4-8.5s-4 6.3-4 8.5Z" />
                <path d="M5 20h14" />
              </svg>
              <span className="small text-white fw-bold">Humedad Sustrato Prom.</span>
            </div>
            <div className="d-flex align-items-baseline justify-content-between pb-2 mb-2">
              <div className="fs-3 fw-bold text-white mb-0">{metricas.humedadProm}%</div>
              <span className="badge bg-success-subtle text-success fw-normal">+3.2% vs prev.</span>
            </div>
            <div className="mt-2 border-top border-secondary border-opacity-25" />
            <span className="d-block mt-2 small text-secondary">Promedio del periodo seleccionado</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-75" aria-hidden="true">
                <path d="M12 3v18" />
                <path d="M7 8h8a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8" />
              </svg>
              <span className="small text-white fw-bold">Agua Suministrada</span>
            </div>
            <div className="d-flex align-items-baseline justify-content-between pb-2 mb-2">
              <div className="fs-3 fw-bold text-white mb-0">{metricas.aguaTotal} L</div>
              <span className="small text-secondary">{metricas.riegosTotales} Riegos tot.</span>
            </div>
            <div className="mt-2 border-top border-secondary border-opacity-25" />
            <span className="d-block mt-2 small text-secondary">Consumo de agua registrado</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-75" aria-hidden="true">
                <path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0Z" />
                <path d="M12 11v6" />
              </svg>
              <span className="small text-white fw-bold">Temp. Promedio Aire</span>
            </div>
            <div className="d-flex align-items-baseline justify-content-between pb-2 mb-2">
              <div className="fs-3 fw-bold text-white mb-0">{metricas.tempProm} °C</div>
              <span className="small text-secondary">Mín: 18°C • Máx: 29°C</span>
            </div>
            <div className="mt-2 border-top border-secondary border-opacity-25" />
            <span className="d-block mt-2 small text-secondary">Rango de temperatura del periodo</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-75" aria-hidden="true">
                <path d="M5 12.55a11 11 0 0 1 14 0" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <line x1="12" y1="20" x2="12.01" y2="20" />
              </svg>
              <span className="small text-white fw-bold">Estado de Conexión</span>
            </div>
            <div className="d-flex align-items-baseline justify-content-between pb-2 mb-2">
              <div className="fs-3 fw-bold text-white mb-0">99.1%</div>
              <span className="badge bg-primary-subtle text-primary fw-normal">RTDB Sync</span>
            </div>
            <div className="mt-2 border-top border-secondary border-opacity-25" />
            <span className="d-block mt-2 small text-secondary">Disponibilidad de sincronización RTDB</span>
          </div>
        </div>
      </div>

      {/* Área de Gráficos */}
      <div className="row g-4">
        {/* Gráfico Tendencia de Humedad */}
        <div className="col-12 col-lg-8">
          <div className="p-4 rounded-3 h-100" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold m-0">
                  <svg className="me-2" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 20c4.4-2.4 7-6.3 7-11-4.7 0-8.6 2.6-11 7" />
                    <path d="M5 19c0-5.5 3.5-9 9-9" />
                    <path d="M5 19c2.3 0 4.1.4 5.5 1" />
                  </svg>
                  Evolución del Sustrato — <span className="text-primary">{currentPot?.name}</span> ({timeRange.toUpperCase()})
                </h6>
                <span className="small text-secondary" style={{ fontSize: '11px' }}>
                  Comportamiento hídrico y activación de pulsos de riego
                </span>
              </div>
              <span className="small text-secondary" style={{ fontSize: '12px' }}>
                {loading ? 'Sincronizando...' : 'Actualizado'}
              </span>
            </div>

            {/* SVG de Tendencia */}
            <div style={{ width: '100%', height: '230px' }} className="pt-2">
              <svg viewBox="0 0 500 160" className="w-100 h-100" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grilla de Fondo */}
                <line x1="0" y1="20" x2="500" y2="20" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                <line x1="0" y1="60" x2="500" y2="60" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                <line x1="0" y1="140" x2="500" y2="140" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />

                {/* Umbral Mínimo Crítico */}
                <line x1="0" y1="115" x2="500" y2="115" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,4" />
                <text x="5" y="110" fill="#ef4444" fontSize="9" fontWeight="bold">Umbral Crítico (35%)</text>

                {/* Relleno con Degradado */}
                <polygon
                  fill="url(#moistureGradient)"
                  points="0,110 50,90 100,105 150,40 200,65 250,50 300,85 350,30 400,60 450,45 500,55 500,150 0,150"
                />

                {/* Curva Principal */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="0,110 50,90 100,105 150,40 200,65 250,50 300,85 350,30 400,60 450,45 500,55"
                />

                {/* Pulsos de Riego */}
                <line x1="150" y1="40" x2="150" y2="150" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,3" />
                <circle cx="150" cy="40" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                <text x="130" y="28" fill="#0284c7" fontSize="9" fontWeight="bold">Riego +150ml</text>

                <line x1="350" y1="30" x2="350" y2="150" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,3" />
                <circle cx="350" cy="30" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                <text x="330" y="18" fill="#0284c7" fontSize="9" fontWeight="bold">Riego +200ml</text>
              </svg>
            </div>

            <div className="d-flex justify-content-between small text-secondary mt-3 pt-1" style={{ fontSize: '12px' }}>
              <span>Inicio ({timeRange})</span>
              <span className="d-flex align-items-center gap-2">
                <span style={{ width: '10px', height: '10px', backgroundColor: '#0284c7', borderRadius: '50%', display: 'inline-block' }}></span>
                Pulsos de Riego
              </span>
              <span>Tiempo Actual</span>
            </div>
          </div>
        </div>

        {/* Consumo por Maceta con Scroll Interno Exclusivo */}
        <div className="col-12 col-lg-4">
          <div 
            className="p-4 rounded-3 h-100 d-flex flex-column" 
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <h6 className="fw-bold mb-1">
              <svg className="me-2" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 3v18h18" />
                <path d="M8 16v-5" />
                <path d="M13 16V7" />
                <path d="M18 16v-8" />
              </svg>
              Distribución de Riego por Nodo
            </h6>
            <p className="text-secondary small mb-3" style={{ fontSize: '12px' }}>
              Haz clic en una maceta para consultar su gráfica e histórico
            </p>

            {/* Contenedor con Scroll dedicado y altura calibrada */}
            <div 
              className="d-flex flex-column gap-3 pe-1 custom-scrollbar" 
              style={{ maxHeight: '250px', overflowY: 'auto' }}
            >
              {potsList.map((p) => {
                const isSelected = p.id === activePotId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActivePotId(p.id);
                      onSelectPot(p.id);
                    }}
                    className={`analytics-pot-button p-3 rounded-3 text-start w-100 flex-shrink-0${isSelected ? ' is-active' : ''}`}
                    style={{ cursor: 'pointer', outline: 'none' }}
                  >
                    <div className="d-flex justify-content-between align-items-center small mb-2">
                      <span className={`analytics-pot-label fw-semibold${isSelected ? ' is-active' : ''}`}>
                        {p.name}
                      </span>
                      <span className="fw-bold">{p.waterDispensed ?? '350 ml'}</span>
                    </div>
                    <div className="progress" style={{ height: '6px', backgroundColor: 'var(--bg-card)' }}>
                      <div
                        className={`progress-bar analytics-pot-progress ${isSelected ? 'is-active' : 'bg-secondary'} rounded-3`}
                        style={{ width: p.id === '01' ? '45%' : p.id === '02' ? '30%' : '25%' }}
                      ></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}