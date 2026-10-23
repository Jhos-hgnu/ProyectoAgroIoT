import React, { useState } from 'react';
import type { PotData } from '../../data/potsData';
import type { Dispositivo, DispositivoPatch, Riego } from '../../types/contrato';
import type { UseTanque } from '../../hooks/useTanque';
import { riegoVencido } from '../../data/adaptador';
import { Proximamente } from '../Proximamente';

interface IrrigationStatusProps {
  pot: PotData;
  isIrrigating: boolean;
  live?: {
    riego: Riego | null;
    tieneBomba: boolean;
    dispositivo?: Dispositivo | null;
    guardandoConfig?: boolean;
    regar?: (duracionSeg?: number) => Promise<void>;
    actualizarConfig?: (cambios: DispositivoPatch) => Promise<boolean>;
    tanque?: UseTanque;
  };
}

function estadoRiego(riego: Riego | null, conectado: boolean): string {
  if (!riego) return 'Sin riegos todavía';
  // La API lo marcará EXPIRADO en la próxima operación; ya no bloquea un riego nuevo.
  if (riegoVencido(riego)) return 'La maceta no confirmó el riego';
  switch (riego.estado) {
    case 'PENDIENTE': return conectado ? 'En cola: esperando a la maceta' : 'En cola: maceta desconectada';
    case 'ENVIADO': return 'Regando…';
    case 'EJECUTADO': {
      const fecha = new Date(riego.finalizadoEn ?? riego.creadoEn);
      const hora = new Intl.DateTimeFormat('es-GT', {
        timeZone: 'America/Guatemala',
        timeStyle: 'short',
      }).format(fecha);
      return `Último riego: ${hora} ✓`;
    }
    case 'FALLIDO': return 'Último riego falló';
    case 'EXPIRADO': return 'La maceta no confirmó el riego';
  }
}

export const IrrigationStatus: React.FC<IrrigationStatusProps> = ({ pot, isIrrigating, live }) => {
  const [autoRulesActive, setAutoRulesActive] = useState(true);
  const estado = live ? estadoRiego(live.riego, live.dispositivo?.conectado ?? false) : isIrrigating ? 'Regando…' : 'Inactiva • Lista';
  const colorEstado = live?.riego?.estado === 'FALLIDO' ? '#F87171'
    : live?.riego?.estado === 'EXPIRADO' || riegoVencido(live?.riego) ? '#94A3B8'
      : isIrrigating ? '#38BDF8' : '#10B981';
  const dispositivo = live?.dispositivo ?? null;
  const riegoAutomatico = dispositivo?.riegoAutomatico ?? false;
  // La API permite encenderlo siempre; solo riega cuando además hay bomba y sensor de suelo activo.
  const switchDeshabilitado = !dispositivo || live?.guardandoConfig === true;
  const riegoManualDeshabilitado = !live?.tieneBomba || isIrrigating;
  const motivoRiegoManual = !live?.tieneBomba ? 'La maceta no tiene bomba configurada'
    : isIrrigating ? 'Hay un riego en curso; espera a que termine (máximo 2 min)' : 'Riega con una duración distinta a la configurada';
  // El bloqueo apaga el riego automático; quitarlo lo vuelve a encender.
  const bloqueoDeshabilitado = switchDeshabilitado;
  const tanque = live?.tanque;
  const colorTanque = !tanque ? '#10B981' : tanque.porcentaje < 15 ? '#F87171' : tanque.porcentaje < 30 ? '#F59E0B' : '#10B981';
  // Dos decimales: cada riego gasta unos pocos ml y con uno solo el cambio no se notaría.
  const litros = (valor: number) => valor.toLocaleString('es-GT', { maximumFractionDigits: 2, minimumFractionDigits: 1 });

  const handleToggleAuto = () => {
    if (!live?.actualizarConfig || switchDeshabilitado) return;
    void live.actualizarConfig({ riegoAutomatico: !riegoAutomatico });
  };

  const handleRiegoPersonalizado = () => {
    if (!live?.regar || riegoManualDeshabilitado) return;
    const respuesta = window.prompt('Duración del riego en segundos (1 a 60):', String(dispositivo?.duracionRiegoSeg ?? 5));
    if (respuesta === null) return;
    const duracion = Number(respuesta);
    if (!Number.isInteger(duracion) || duracion < 1 || duracion > 60) {
      window.alert('La duración debe ser un número entero entre 1 y 60 segundos.');
      return;
    }
    void live.regar(duracion);
  };

  const handleBloqueo = () => {
    if (!live?.actualizarConfig || bloqueoDeshabilitado) return;
    if (!riegoAutomatico) {
      void live.actualizarConfig({ riegoAutomatico: true });
      return;
    }
    if (window.confirm('¿Desactivar el riego automático de esta maceta? El riego manual seguirá disponible.')) {
      void live.actualizarConfig({ riegoAutomatico: false });
    }
  };

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

          {live ? (
            <div className="d-flex align-items-center gap-3">
              <div className="text-end">
                <div className="fw-semibold text-white" style={{ fontSize: '11px', lineHeight: '1.2' }}>Auto-Reglas</div>
                <small
                  style={{ fontSize: '10px', color: dispositivo && !dispositivo.riegoAutomaticoDisponible && riegoAutomatico ? '#F59E0B' : '#64748B' }}
                  title={dispositivo && !dispositivo.riegoAutomaticoDisponible
                    ? 'Queda guardado, pero solo regará cuando la maceta tenga bomba y el sensor de suelo envíe lecturas.'
                    : undefined}
                >
                  {!dispositivo ? '—'
                    : dispositivo.riegoAutomaticoDisponible ? `Bajo ${dispositivo.umbralRiego}%`
                      : 'Sin sensor de suelo'}
                </small>
              </div>
              <div className="form-check form-switch m-0 p-0 d-flex align-items-center">
                <input
                  className="form-check-input shadow-none ms-0 cursor-pointer"
                  type="checkbox"
                  role="switch"
                  aria-label="Riego automático"
                  checked={riegoAutomatico}
                  disabled={switchDeshabilitado}
                  onChange={handleToggleAuto}
                  style={{
                    width: '40px',
                    height: '21px',
                    backgroundColor: riegoAutomatico ? '#10B981' : '#334155',
                    borderColor: 'transparent',
                    cursor: switchDeshabilitado ? 'not-allowed' : 'pointer',
                  }}
                />
              </div>
            </div>
          ) : (
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
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* MÉTRICAS CON MEJOR ESPACIADO EN ESTADO BOMBA */}
        <div className="row g-3 mb-4">
          <div className="col-4">
            <div>
              <span className="d-block text-truncate mb-1" style={{ fontSize: '11px', color: '#94A3B8' }}>Estado Bomba</span>
              <span 
                className="fw-bold d-inline-flex align-items-center gap-2 px-1" 
                style={{ fontSize: '13px', color: live && !live.tieneBomba ? '#94A3B8' : colorEstado }}
              >
                <span 
                  className="rounded-circle shrink-0" 
                  style={{ 
                    width: '7px', 
                    height: '7px', 
                    backgroundColor: live && !live.tieneBomba ? '#64748B' : colorEstado,
                    boxShadow: isIrrigating ? `0 0 6px ${colorEstado}` : 'none'
                  }}
                ></span>
                <span className="ms-0.5">{live && !live.tieneBomba ? 'Sin bomba' : estado}</span>
              </span>
            </div>
          </div>

          <div className="col-4">
            <div>
              <span className="d-block text-truncate mb-1" style={{ fontSize: '11px', color: '#94A3B8' }}>{live ? 'Suministrado (24 h)' : 'Suministrado Hoy'}</span>
              <span className="fw-bold text-white d-block" style={{ fontSize: '13px' }} title={tanque ? 'Estimado: segundos de bomba × caudal configurado' : undefined}>
                {live
                  ? tanque
                    ? <>≈ {tanque.mlUltimas24h} ml <small className="fw-normal ms-1" style={{ color: '#64748B' }}>({tanque.ciclosUltimas24h} ciclos)</small></>
                    : <><Proximamente /> <small className="fw-normal ms-1" style={{ color: '#64748B' }}>({pot.waterCycles ?? 0} ciclos)</small></>
                  : <>{pot.waterDispensed ?? <Proximamente />} <small className="fw-normal ms-1" style={{ color: '#64748B' }}>({pot.waterCycles ?? '—'} ciclos)</small></>}
              </span>
            </div>
          </div>

          <div className="col-4">
            <div>
              <span className="d-block text-truncate mb-1" style={{ fontSize: '11px', color: '#94A3B8' }}>Depósito Reserva</span>
              <span className="fw-bold text-white d-block" style={{ fontSize: '13px' }} title={tanque ? 'Estimado desde el último rellenado' : undefined}>
                {live
                  ? tanque ? `≈ ${litros(tanque.litrosRestantes)}L / ${litros(tanque.config.capacidadL)}L` : <Proximamente />
                  : pot.waterReservoir ?? <Proximamente />}
              </span>
            </div>
          </div>
        </div>

        {/* BARRA DE CAPACIDAD DE AGUA */}
        {live && tanque ? (
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ fontSize: '11px' }}>
              <span style={{ color: '#64748B' }}>Nivel del tanque de agua (estimado)</span>
              <span className="d-flex align-items-center gap-2">
                <span className="fw-semibold" style={{ color: colorTanque }}>{tanque.porcentaje}% Disponible</span>
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none"
                  style={{ fontSize: '11px', color: '#38BDF8' }}
                  onClick={() => {
                    if (window.confirm('¿Rellenaste el tanque? El nivel volverá al 100 %.')) tanque.marcarRellenado();
                  }}
                  title="Marca el tanque como lleno"
                >
                  Rellenado
                </button>
              </span>
            </div>
            <div className="progress" style={{ height: '6px', backgroundColor: '#0D1527' }}>
              <div
                className="progress-bar rounded-pill"
                role="progressbar"
                aria-valuenow={tanque.porcentaje}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{ width: `${tanque.porcentaje}%`, backgroundColor: colorTanque }}
              ></div>
            </div>
          </div>
        ) : live ? (
          <div className="mb-4">
            <span style={{ color: '#64748B', fontSize: '11px' }}>Nivel del tanque de agua</span>
            <div><Proximamente /></div>
          </div>
        ) : <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-1.5" style={{ fontSize: '11px' }}>
            <span style={{ color: '#64748B' }}>Nivel del tanque de agua</span>
            <span className="fw-semibold text-success">{pot.reservoirPercent ?? '—'}% Disponible</span>
          </div>
          <div className="progress" style={{ height: '6px', backgroundColor: '#0D1527' }}>
            <div 
              className="progress-bar rounded-pill" 
              role="progressbar" 
              style={{ width: `${pot.reservoirPercent ?? 0}%`, backgroundColor: '#10B981' }}
            ></div>
          </div>
        </div>}
      </div>

      {/* BOTONES CENTRADOS */}
      <div className="row g-2 pt-2 border-top border-secondary border-opacity-10">
        <div className="col-6">
          <button
            type="button"
            className="btn btn-sm w-100 fw-medium d-flex align-items-center justify-content-center gap-2 border border-secondary border-opacity-25 py-2.5 rounded-3 text-white shadow-sm"
            style={{
              backgroundColor: '#1E293B',
              fontSize: '12px',
              cursor: live && riegoManualDeshabilitado ? 'not-allowed' : 'pointer',
              opacity: live && riegoManualDeshabilitado ? 0.7 : 1,
            }}
            onClick={live ? handleRiegoPersonalizado : undefined}
            disabled={live !== undefined && riegoManualDeshabilitado}
            title={live ? motivoRiegoManual : undefined}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <span>{live ? 'Duración Personalizada...' : 'Volumen Personalizado...'}</span>
          </button>
        </div>

        <div className="col-6">
          <button
            type="button"
            className="btn btn-sm w-100 fw-medium d-flex align-items-center justify-content-center gap-2 border border-secondary border-opacity-25 py-2.5 rounded-3 shadow-sm"
            style={{
              backgroundColor: '#1E293B',
              color: live && !riegoAutomatico ? '#10B981' : '#F87171',
              fontSize: '12px',
              cursor: live && bloqueoDeshabilitado ? 'not-allowed' : 'pointer',
              opacity: live && bloqueoDeshabilitado ? 0.7 : 1,
            }}
            onClick={live ? handleBloqueo : undefined}
            disabled={live !== undefined && bloqueoDeshabilitado}
            title={live
              ? riegoAutomatico ? 'Desactiva el riego automático' : 'Vuelve a activar el riego automático'
              : undefined}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={live && !riegoAutomatico ? '#10B981' : '#F87171'} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            <span>{live && !riegoAutomatico ? 'Quitar Bloqueo' : 'Bloqueo de Emergencia'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};