import React from 'react';

interface SidebarProps {
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, activeTab, setActiveTab }) => {
  return (
    <aside 
      className="d-flex flex-column justify-content-between p-3 border-end sticky-top" 
      style={{ 
        width: '250px', 
        height: '100vh', 
        backgroundColor: 'var(--bg-sidebar)', 
        borderColor: 'var(--border-color)',
        zIndex: 1020,
        transition: 'all 0.3s ease'
      }}
    >
      <div>
        {/* LOGO AGROIOT */}
        <div className="d-flex align-items-center gap-3 mb-4 px-1">
          <div 
            className="rounded-3 d-flex align-items-center justify-content-center shadow-sm shrink-0" 
            style={{ width: '42px', height: '42px', backgroundColor: '#10B981' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 15h10l1 7H6l1-7z"></path>
              <path d="M12 15V8"></path>
              <path d="M12 11C10 9 8 9.5 7 11C6.5 8 8 6 12 8"></path>
              <path d="M12 11C14 9 16 9.5 17 11C17.5 8 16 6 12 8"></path>
            </svg>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold fs-5 tracking-wide">AgroIoT</span>
              <span 
                className="badge rounded-pill text-success border border-success border-opacity-30" 
                style={{ fontSize: '9px', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '3px 7px' }}
              >
                PRO
              </span>
            </div>
            <small className="d-block text-secondary" style={{ fontSize: '11px' }}>
              Sistema Operativo de Invernadero
            </small>
          </div>
        </div>

        {/* ESTADOS ESP32 Y FIREBASE */}
        <div className="rounded-3 p-3 mb-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '12px' }}>
            <span className="d-flex align-items-center gap-2 text-secondary">
              <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#10B981' }}></span>
              ESP32 Mesh
            </span>
            <span className="fw-medium" style={{ color: '#10B981' }}>En línea</span>
          </div>
          <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '12px' }}>
            <span className="d-flex align-items-center gap-2 text-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
              </svg>
              Firebase RTDB
            </span>
            <span className="fw-medium" style={{ color: '#38BDF8' }}>Conectado</span>
          </div>
        </div>

        {/* CONTROLES */}
        <p className="text-uppercase fw-bold px-1 mb-2.5 text-secondary" style={{ fontSize: '10px', letterSpacing: '0.8px' }}>
          Controles
        </p>

        <nav className="d-flex flex-column gap-1.5">
          {/* Vista General */}
          <button 
            className="btn text-start border-0 fw-medium d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 shadow-sm"
            onClick={() => setActiveTab('overview')}
            style={{ 
              backgroundColor: activeTab === 'overview' ? '#10B981' : 'transparent', 
              color: activeTab === 'overview' ? '#022C22' : 'var(--text-secondary)' 
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
            <span>Vista General</span>
          </button>

          {/* Dispositivos */}
          <button 
            className="btn border-0 text-start d-flex align-items-center gap-3 px-3 py-2.5 rounded-3" 
            onClick={() => setActiveTab('devices')}
            style={{ 
              backgroundColor: activeTab === 'devices' ? '#10B981' : 'transparent', 
              color: activeTab === 'devices' ? '#022C22' : 'var(--text-secondary)' 
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></svg>
            <span>Dispositivos</span>
          </button>

          {/* Analíticas */}
          <button 
            className="btn border-0 text-start d-flex align-items-center gap-3 px-3 py-2.5 rounded-3" 
            onClick={() => setActiveTab('analytics')}
            style={{ 
              backgroundColor: activeTab === 'analytics' ? '#10B981' : 'transparent', 
              color: activeTab === 'analytics' ? '#022C22' : 'var(--text-secondary)' 
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span>Análisis</span>
          </button>

          {/* Alertas */}
          <button 
            className="btn border-0 text-start d-flex align-items-center gap-3 px-3 py-2.5 rounded-3" 
            onClick={() => setActiveTab('alerts')}
            style={{ 
              backgroundColor: activeTab === 'alerts' ? '#10B981' : 'transparent', 
              color: activeTab === 'alerts' ? '#022C22' : 'var(--text-secondary)' 
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>Alertas</span>
          </button>

          {/* Configuración */}
          <button 
            className="btn border-0 text-start d-flex align-items-center gap-3 px-3 py-2.5 rounded-3" 
            onClick={() => setActiveTab('settings')}
            style={{ 
              backgroundColor: activeTab === 'settings' ? '#10B981' : 'transparent', 
              color: activeTab === 'settings' ? '#022C22' : 'var(--text-secondary)' 
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
            <span>Configuración</span>
          </button>
        </nav>
      </div>

      {/* PERFIL INFERIOR Y BOTÓN SALIR */}
      <div className="pt-3 d-flex align-items-center justify-content-between" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="d-flex align-items-center gap-3">
          <div 
            className="rounded-circle text-dark fw-bold d-flex align-items-center justify-content-center shadow-sm" 
            style={{ width: '36px', height: '36px', fontSize: '12px', backgroundColor: '#10B981' }}
          >
            ER
          </div>
          <div>
            <div className="fw-semibold leading-tight" style={{ fontSize: '13px' }}>Elena R.</div>
            <div className="text-secondary" style={{ fontSize: '11px' }}>Ing. Agrónoma</div>
          </div>
        </div>

        {/* BOTÓN SALIR / CERRAR SESIÓN */}
        <button 
          title="Cerrar sesión" 
          onClick={onLogout}
          className="btn btn-sm border-0 p-1.5 ms-2 text-secondary" 
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </aside>
  );
};