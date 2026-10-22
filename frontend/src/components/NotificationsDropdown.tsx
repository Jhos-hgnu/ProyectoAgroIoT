import React from 'react';

export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tiempo: string;
  tipo: 'alerta' | 'riego' | 'sistema';
  vistaDestino: string;
}

interface NotificationsDropdownProps {
  notificaciones: Notificacion[];
  onMarcarTodasLeidas: () => void;
  onEliminarNotificacion: (id: number) => void;
  onNavigate: (vista: string) => void;
  onClose: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  notificaciones,
  onMarcarTodasLeidas,
  onEliminarNotificacion,
  onNavigate,
  onClose,
}) => {
  return (
    <div
      className="notification-dropdown position-absolute end-0 mt-2 rounded-3 shadow-lg p-2 custom-scrollbar"
      style={{
        width: '340px',
        maxHeight: '380px',
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        border: '1px solid var(--border-color)',
        zIndex: 1050,
        overflowY: 'auto',
      }}
    >
      {/* Encabezado */}
      <div
        className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <h6 className="fw-bold mb-0" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
          Notificaciones
        </h6>
        {notificaciones.length > 0 && (
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none small text-secondary opacity-75 notification-mark-read"
            style={{ fontSize: '11px' }}
            onClick={onMarcarTodasLeidas}
          >
            Marcar leídas
          </button>
        )}
      </div>

      <div className="d-flex flex-column gap-2">
        {notificaciones.length === 0 ? (
          <p className="text-secondary small text-center my-3 opacity-75">
            No tienes notificaciones pendientes.
          </p>
        ) : (
          notificaciones.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                onNavigate(n.vistaDestino);
                onClose();
              }}
              className="notification-item p-2 rounded-3 position-relative d-flex justify-content-between align-items-start transition-all"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
            >
              {/* Contenido principal */}
              <div className="flex-grow-1 pe-2">
                <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                  <strong className="notification-title fw-semibold" style={{ fontSize: '12px', color: 'var(--badge-text)' }}>
                    {n.titulo}
                  </strong>
                  <span className="text-secondary opacity-75 flex-shrink-0" style={{ fontSize: '10px' }}>
                    {n.tiempo}
                  </span>
                </div>
                <p
                  className="text-secondary mb-0 notification-message"
                  style={{ fontSize: '11px', lineHeight: '1.35', color: 'var(--text-primary)' }}
                >
                  {n.mensaje}
                </p>
              </div>

              {/* Botón descartar X */}
              <button
                type="button"
                className="btn-close notification-dismiss ms-2 opacity-50"
                style={{ fontSize: '8px', filter: 'var(--btn-close-filter, none)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEliminarNotificacion(n.id);
                }}
              ></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};