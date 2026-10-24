import React, { useState } from 'react';
import type { Dispositivo, DispositivoPatch } from '../../types/contrato';
import type { UseTanque } from '../../hooks/useTanque';

interface ConfigRiegoModalProps {
  dispositivo: Dispositivo;
  guardando: boolean;
  onClose: () => void;
  onGuardar: (cambios: DispositivoPatch) => Promise<boolean>;
  /** Caudal y capacidad para estimar el agua (se guardan en este navegador). */
  tanque?: UseTanque;
}

/**
 * Parámetros de riego de la maceta (PATCH /dispositivos/{id}): umbral, duración y espera entre riegos.
 * Además, caudal de la bomba y capacidad del tanque para estimar el agua usada.
 */
export const ConfigRiegoModal: React.FC<ConfigRiegoModalProps> = ({ dispositivo, guardando, onClose, onGuardar, tanque }) => {
  const [umbral, setUmbral] = useState(String(dispositivo.umbralRiego));
  const [duracion, setDuracion] = useState(String(dispositivo.duracionRiegoSeg));
  const [espera, setEspera] = useState(String(dispositivo.esperaRiegoMin));
  const [caudal, setCaudal] = useState(String(tanque?.config.caudalMlPorSeg ?? ''));
  const [capacidad, setCapacidad] = useState(String(tanque?.config.capacidadL ?? ''));
  const [tieneBomba, setTieneBomba] = useState(dispositivo.tieneBomba);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tanque) {
      const caudalMlPorSeg = Number(caudal);
      const capacidadL = Number(capacidad);
      if (!Number.isFinite(caudalMlPorSeg) || caudalMlPorSeg <= 0) {
        setError('El caudal de la bomba debe ser mayor que 0 ml/s.');
        return;
      }
      if (!Number.isFinite(capacidadL) || capacidadL <= 0) {
        setError('La capacidad del tanque debe ser mayor que 0 L.');
        return;
      }
      tanque.guardar({ caudalMlPorSeg, capacidadL });
    }
    const valores = { umbralRiego: Number(umbral), duracionRiegoSeg: Number(duracion), esperaRiegoMin: Number(espera) };
    if (!Number.isFinite(valores.umbralRiego) || valores.umbralRiego < 0 || valores.umbralRiego > 100) {
      setError('El umbral debe estar entre 0 y 100 %.');
      return;
    }
    if (!Number.isInteger(valores.duracionRiegoSeg) || valores.duracionRiegoSeg < 1 || valores.duracionRiegoSeg > 60) {
      setError('La duración debe ser un número entero entre 1 y 60 segundos.');
      return;
    }
    if (!Number.isInteger(valores.esperaRiegoMin) || valores.esperaRiegoMin < 0) {
      setError('La espera debe ser un número entero de 0 minutos o más.');
      return;
    }

    // Solo se envían los campos que cambiaron.
    const cambios: DispositivoPatch = {};
    if (valores.umbralRiego !== Number(dispositivo.umbralRiego)) cambios.umbralRiego = valores.umbralRiego;
    if (valores.duracionRiegoSeg !== dispositivo.duracionRiegoSeg) cambios.duracionRiegoSeg = valores.duracionRiegoSeg;
    if (valores.esperaRiegoMin !== dispositivo.esperaRiegoMin) cambios.esperaRiegoMin = valores.esperaRiegoMin;
    if (tieneBomba !== dispositivo.tieneBomba) cambios.tieneBomba = tieneBomba;
    if (Object.keys(cambios).length === 0 || await onGuardar(cambios)) {
      onClose();
      return;
    }
    setError('No se pudo guardar en la API. Revisa la conexión e inténtalo de nuevo.');
  };

  const campos: Array<{ etiqueta: string; ayuda: string; valor: string; cambiar: (v: string) => void; min: number; max?: number; step: string; unidad: string }> = [
    { etiqueta: 'UMBRAL DE RIEGO', ayuda: 'El riego automático se activa cuando la humedad del suelo baja de este valor.', valor: umbral, cambiar: setUmbral, min: 0, max: 100, step: '0.5', unidad: '%' },
    { etiqueta: 'DURACIÓN DEL RIEGO', ayuda: 'Tiempo que funciona la bomba en cada riego (automático o "Regar ahora").', valor: duracion, cambiar: setDuracion, min: 1, max: 60, step: '1', unidad: 's' },
    { etiqueta: 'ESPERA ENTRE RIEGOS', ayuda: 'Tiempo mínimo entre dos riegos automáticos, para que el agua se absorba.', valor: espera, cambiar: setEspera, min: 0, step: '1', unidad: 'min' },
    ...(tanque ? [
      { etiqueta: 'CAUDAL DE LA BOMBA', ayuda: 'Para medirlo: riega 10 s sobre un vaso medidor y divide los ml entre 10. Se guarda en este navegador.', valor: caudal, cambiar: setCaudal, min: 0.1, step: '0.1', unidad: 'ml/s' },
      { etiqueta: 'CAPACIDAD DEL TANQUE', ayuda: 'Litros del depósito lleno. El nivel se estima restando el agua de cada riego.', valor: capacidad, cambiar: setCapacidad, min: 0.1, step: '0.1', unidad: 'L' },
    ] : []),
  ];

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(5, 10, 20, 0.75)', zIndex: 1050, backdropFilter: 'blur(4px)', cursor: 'pointer' }}
    >
      <div
        className="w-100 mx-3 rounded-4 border border-secondary border-opacity-25 shadow-lg custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-riego-titulo"
        style={{ maxWidth: '440px', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', backgroundColor: '#131B2E', color: '#FFFFFF', cursor: 'default' }}
      >
        {/* ENCABEZADO */}
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom border-secondary border-opacity-10">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center shrink-0"
              style={{ width: '40px', height: '40px', backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#38BDF8' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <h6 id="config-riego-titulo" className="fw-bold text-white mb-0" style={{ fontSize: '16px' }}>
                Configurar Riego
              </h6>
              <small style={{ fontSize: '11px', color: '#94A3B8' }}>
                {dispositivo.nombre} • se guarda en la API
              </small>
            </div>
          </div>

          <button type="button" className="btn p-1 text-secondary shadow-none border-0" onClick={onClose} aria-label="Cerrar" style={{ cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="p-4 d-flex flex-column gap-3">
            <div className="form-check form-switch m-0 d-flex align-items-start gap-2 ps-0">
              <input
                className="form-check-input shadow-none ms-0 mt-1"
                type="checkbox"
                role="switch"
                id="config-tiene-bomba"
                checked={tieneBomba}
                onChange={(e) => setTieneBomba(e.target.checked)}
                style={{ width: '36px', height: '19px', backgroundColor: tieneBomba ? '#10B981' : '#334155', borderColor: 'transparent', cursor: 'pointer' }}
              />
              <label className="form-check-label" htmlFor="config-tiene-bomba">
                <span className="d-block fw-semibold" style={{ fontSize: '12px', color: '#CBD5E1' }}>La maceta tiene bomba de riego</span>
                <small className="d-block" style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Apágalo si la maceta no tiene relé y bomba: se desactivan "Regar ahora" y el riego automático.
                </small>
              </label>
            </div>

            {campos.map((campo) => (
              <div key={campo.etiqueta}>
                <label className="form-label fw-semibold mb-1" style={{ fontSize: '11px', color: '#CBD5E1' }}>
                  {campo.etiqueta}
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control text-white border-secondary border-opacity-25 shadow-none"
                    value={campo.valor}
                    min={campo.min}
                    max={campo.max}
                    step={campo.step}
                    onChange={(e) => campo.cambiar(e.target.value)}
                    style={{ backgroundColor: '#0D1527', fontSize: '13px' }}
                    required
                  />
                  <span className="input-group-text border-secondary border-opacity-25 text-secondary" style={{ backgroundColor: '#0D1527', fontSize: '12px' }}>
                    {campo.unidad}
                  </span>
                </div>
                <small className="d-block mt-1" style={{ fontSize: '11px', color: '#94A3B8' }}>{campo.ayuda}</small>
              </div>
            ))}

            {error && (
              <div className="alert alert-warning mb-0 py-2" role="alert" style={{ fontSize: '12px' }}>
                {error}
              </div>
            )}
          </div>

          <div className="p-4 pt-2 border-top border-secondary border-opacity-10">
            <button
              type="submit"
              className="btn w-100 py-2.5 fw-semibold text-white border-0 rounded-3 shadow-sm"
              style={{ backgroundColor: '#0284C7', fontSize: '13px', cursor: guardando ? 'wait' : 'pointer' }}
              disabled={guardando}
            >
              {guardando ? 'Guardando…' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
