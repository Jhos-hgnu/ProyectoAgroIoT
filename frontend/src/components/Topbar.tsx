import React, { useState, useEffect, useRef } from 'react';
import type { PotData } from '../data/potsData';
import { NotificationsDropdown, type Notificacion } from './NotificationsDropdown';

interface TopbarProps {
  selectedPotId: string;
  onSelectPot: (id: string) => void;
  potsList: PotData[];
  onOpenAddPotModal: () => void;
  onNavigate?: (vista: string) => void;
  /** Notificaciones reales de la API; si faltan, se muestran las de ejemplo. */
  notificacionesLive?: Notificacion[];
}

const NOTIFICACIONES_INICIALES: Notificacion[] = [
  {
    id: 1,
    titulo: 'Déficit Hídrico Detectado',
    mensaje: 'Maceta 03 - Pimientos Dulces bajó al 38% de humedad.',
    tiempo: 'Hace 5 min',
    tipo: 'alerta',
    vistaDestino: 'alerts', // Apunta a la pestaña de Alertas
  },
  {
    id: 2,
    titulo: 'Riego Autónomo Ejecutado',
    mensaje: 'Se suministraron +150ml de agua en Maceta 02.',
    tiempo: 'Hace 25 min',
    tipo: 'riego',
    vistaDestino: 'analytics', // Apunta a la pestaña de Análisis
  },
  {
    id: 3,
    titulo: 'Nodo Reconectado',
    mensaje: 'Maceta 01 volvió a estar en línea vía ESP32 Mesh.',
    tiempo: 'Hace 1 hora',
    tipo: 'sistema',
    vistaDestino: 'devices', // Apunta a la pestaña de Dispositivos
  },
];

export const Topbar: React.FC<TopbarProps> = ({ 
  selectedPotId, 
  onSelectPot, 
  potsList, 
  onOpenAddPotModal,
  onNavigate = () => {},
  notificacionesLive,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Se guardan los ids descartados para que el polling no vuelva a mostrarlos.
  const [descartadas, setDescartadas] = useState<Set<number>>(() => new Set());
  const notificaciones = (notificacionesLive ?? NOTIFICACIONES_INICIALES).filter((n) => !descartadas.has(n.id));

  const selectorRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const currentPot = potsList.find(p => p.id === selectedPotId) || potsList[0];

  const marcarTodasLeidas = () => {
    setDescartadas((prev) => new Set([...prev, ...notificaciones.map((n) => n.id)]));
  };

  const eliminarNotificacion = (id: number) => {
    setDescartadas((prev) => new Set(prev).add(id));
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header 
      className="px-4 py-2 d-flex align-items-center justify-content-between sticky-top border-bottom w-100" 
      style={{ 
        height: '68px', 
        zIndex: 1010, 
        backgroundColor: 'var(--bg-topbar)', 
        borderColor: 'var(--border-color)',
        transition: 'all 0.3s ease' 
      }}
    >
      <div className="d-flex align-items-center gap-3 ms-auto">

        {/* SELECTOR DE MACETA */}
        <div className="position-relative" ref={selectorRef}>
          <button 
            className="btn rounded-pill d-flex align-items-center gap-2.5 px-3 py-2 border-0"
            onClick={() => {
              setIsOpen(!isOpen);
              setShowNotifications(false);
            }}
            style={{ 
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)', 
              fontSize: '13px',
              color: 'var(--text-primary)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 10v10M12 10a4 4 0 0 1 4-4h3v3a4 4 0 0 1-4 4h-3zM12 14a4 4 0 0 0-4-4H5v3a4 4 0 0 0 4 4h3z"/>
            </svg>
            <span className="fw-medium">{currentPot?.name || 'Seleccionar Maceta'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ms-1 opacity-75">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          {isOpen && (
            <div 
              className="position-absolute mt-2 rounded-3 shadow-lg border py-1"
              style={{ 
                backgroundColor: 'var(--bg-card)', 
                borderColor: 'var(--border-color)', 
                minWidth: '240px', 
                zIndex: 1050, 
                right: 0 
              }}
            >
              {potsList.map((pot) => (
                <button
                  key={pot.id}
                  className="w-100 text-start btn border-0 px-3 py-2 d-flex align-items-center gap-2"
                  style={{ 
                    fontSize: '13px', 
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => {
                    onSelectPot(pot.id);
                    setIsOpen(false);
                  }}
                >
                  <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: pot.id === selectedPotId ? '#10B981' : 'transparent' }}></span>
                  {pot.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* NOTIFICACIONES DESPLEGABLES */}
        <div className="position-relative" ref={notificationsRef}>
          <button
            className="btn btn-sm position-relative rounded-circle d-flex align-items-center justify-content-center border-0"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setIsOpen(false);
            }}
            style={{
              backgroundColor: showNotifications ? 'var(--badge-bg)' : 'transparent',
              border: showNotifications ? '1px solid var(--badge-text)' : '1px solid var(--border-color)',
              width: '38px',
              height: '38px',
              color: 'var(--text-primary)',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>

            {notificaciones.length > 0 && (
              <span
                className="position-absolute rounded-circle"
                style={{ top: '8px', right: '8px', width: '7px', height: '7px', backgroundColor: '#EF4444' }}
              ></span>
            )}
          </button>

          {/* Menú Desplegable con callbacks de navegación */}
          {showNotifications && (
            <NotificationsDropdown
              notificaciones={notificaciones}
              onMarcarTodasLeidas={marcarTodasLeidas}
              onEliminarNotificacion={eliminarNotificacion}
              onNavigate={onNavigate}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>

        {/* BOTÓN AGREGAR */}
        <button 
          className="btn btn-sm fw-semibold d-flex align-items-center gap-2 border-0 px-3.5 py-2 rounded-3 text-dark" 
          style={{ backgroundColor: '#10B981', fontSize: '13px', cursor: 'pointer' }}
          onClick={onOpenAddPotModal}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#022C22" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Agregar</span>
        </button>
      </div>
    </header>
  );
};