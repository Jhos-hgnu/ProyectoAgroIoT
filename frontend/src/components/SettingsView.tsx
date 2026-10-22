import { useState, useEffect } from 'react';

type ThemeType = 'dark' | 'light' | 'coquette';

interface SettingsViewProps {
  currentTheme?: ThemeType;
  onThemeChange?: (theme: ThemeType) => void;
}

export function SettingsView({ currentTheme = 'dark', onThemeChange }: SettingsViewProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>(currentTheme);

  useEffect(() => {
    setSelectedTheme(currentTheme);
  }, [currentTheme]);

  const [userProfile, setUserProfile] = useState({
    name: 'Elena R.',
    role: 'Ing. Agrónoma',
    email: 'elena.agrolot@ejemplo.com',
  });
  const [syncInterval, setSyncInterval] = useState('5');
  const [autoWatering, setAutoWatering] = useState(true);

  const handleThemeChange = (theme: ThemeType) => {
    setSelectedTheme(theme);
    if (onThemeChange) {
      onThemeChange(theme);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('agrolot-theme', theme);
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Encabezado */}
      <div>
        <h3 className="fw-bold mb-1">Configuración del Sistema</h3>
        <p className="mb-0 text-secondary" style={{ fontSize: '14px' }}>
          Personalización visual, preferencias de cuenta y parámetros globales del invernadero
        </p>
      </div>

      <div className="row g-4">
        {/* Columna Izquierda: Personalización de Tema Visual */}
        <div className="col-12 col-lg-6">
          <div className="p-4 rounded-3" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="d-flex align-items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-75">
                <circle cx="12" cy="12" r="5"></circle>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
              </svg>
              <h6 className="fw-bold m-0">Tema y Apariencia Web</h6>
            </div>

            <p className="small mb-3 text-secondary" style={{ fontSize: '13px' }}>
              Selecciona la paleta de colores preferida para la interfaz del sistema:
            </p>

            <div className="d-flex flex-column gap-3">
              {/* Opción 1: Tema Oscuro */}
              <div
                className="p-3 rounded-3 d-flex align-items-center justify-content-between transition-all"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: selectedTheme === 'dark' ? '2px solid #10b981' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}
                onClick={() => handleThemeChange('dark')}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-75">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0" style={{ fontSize: '14px' }}>Oscuro Esmeralda (Predeterminado)</h6>
                    <span className="small text-secondary" style={{ fontSize: '11px' }}>Fondo #0F172A • Tarjetas oscuras</span>
                  </div>
                </div>
                {selectedTheme === 'dark' && (
                  <span className="badge rounded-pill px-3 py-1 fw-normal" style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--badge-text)' }}>
                    Activo
                  </span>
                )}
              </div>

              {/* Opción 2: Tema Claro */}
              <div
                className="p-3 rounded-3 d-flex align-items-center justify-content-between transition-all"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: selectedTheme === 'light' ? '2px solid #0284c7' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}
                onClick={() => handleThemeChange('light')}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-75">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0" style={{ fontSize: '14px' }}>Claro Invernadero</h6>
                    <span className="small text-secondary" style={{ fontSize: '11px' }}>Fondo slate claro • Tarjetas blancas</span>
                  </div>
                </div>
                {selectedTheme === 'light' && (
                  <span className="badge rounded-pill px-3 py-1 fw-normal" style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--badge-text)' }}>
                    Activo
                  </span>
                )}
              </div>

              {/* Opción 3: Tema Rosado Coquette */}
              <div
                className="p-3 rounded-3 d-flex align-items-center justify-content-between transition-all"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: selectedTheme === 'coquette' ? '2px solid #f472b6' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}
                onClick={() => handleThemeChange('coquette')}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-75">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                    </svg>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0" style={{ fontSize: '14px' }}>Rosado Coquette</h6>
                    <span className="small text-secondary" style={{ fontSize: '11px' }}>Fondo rosa pastel • Estilo suave</span>
                  </div>
                </div>
                {selectedTheme === 'coquette' && (
                  <span className="badge rounded-pill px-3 py-1 fw-normal" style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--badge-text)' }}>
                    Activo
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Configuración de Cuenta y Parámetros */}
        <div className="col-12 col-lg-6">
          <div className="d-flex flex-column gap-4">
            {/* Perfil de Usuario */}
            <div className="p-4 rounded-3" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h6 className="fw-bold mb-3">Perfil de Operador</h6>

              <div className="mb-3">
                <label className="form-label small text-secondary">Nombre de Usuario</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '13px' }}
                  value={userProfile.name}
                  onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small text-secondary">Rol / Cargo</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '13px' }}
                  value={userProfile.role}
                  onChange={(e) => setUserProfile({ ...userProfile, role: e.target.value })}
                />
              </div>
            </div>

            {/* Parámetros de Telemetría */}
            <div className="p-4 rounded-3" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h6 className="fw-bold mb-3">Parámetros de Telemetría RTDB</h6>

              <div className="mb-3">
                <label className="form-label small d-flex justify-content-between text-secondary">
                  <span>Frecuencia de Muestreo (Macetas):</span>
                  <span className="fw-bold">{syncInterval} seg</span>
                </label>
                <select
                  className="form-select"
                  style={{ fontSize: '13px' }}
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(e.target.value)}
                >
                  <option value="1">1 segundo (Tiempo real)</option>
                  <option value="5">5 segundos (Estándar)</option>
                  <option value="15">15 segundos (Ahorro batería)</option>
                </select>
              </div>

              <div className="form-check form-switch mt-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="autoWateringSwitch"
                  checked={autoWatering}
                  onChange={(e) => setAutoWatering(e.target.checked)}
                />
                <label className="form-check-label small" htmlFor="autoWateringSwitch">
                  Modo Riego Autónomo General
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}