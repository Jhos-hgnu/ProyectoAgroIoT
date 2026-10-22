import { useState } from "react";
import type { PotData } from "../data/potsData";

interface AlertItem {
  id: string;
  potId: string;
  potName: string;
  type: "deficit" | "temp" | "info";
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  metricInfo?: {
    label: string;
    value: string;
    target?: string;
  };
  suggestedAction?: {
    label: string;
  };
}

interface AlertsViewProps {
  potsList: PotData[];
}

export function AlertsView({ potsList }: AlertsViewProps) {
  const [resolvedAlertIds, setResolvedAlertIds] = useState<Set<string>>(
    () => new Set(),
  );
  const historicalAlerts: AlertItem[] = [{
      id: "alt-3",
      potId: "01",
      potName:
        potsList.find((p) => p.id === "01")?.name ||
        "Maceta 01 — Tomates Cherry",
      type: "info",
      title: "Riego Automático Completado",
      description:
        "Humedad del sustrato estabilizada en 72% tras pulso programado.",
      timestamp: "Hace 2 horas",
      resolved: true,
      metricInfo: { label: "Humedad Sustrato", value: "72%", target: "Óptimo" },
  }];
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("active");
  const [soilThreshold, setSoilThreshold] = useState<number>(45);
  const [tempThreshold, setTempThreshold] = useState<number>(30);
  const [telegramNotif, setTelegramNotif] = useState<boolean>(true);
  const [webNotif, setWebNotif] = useState<boolean>(true);

  const currentAlerts = potsList.flatMap((pot): AlertItem[] => {
    if (pot.isLoading) return [];

    const alertsForPot: AlertItem[] = [];
    if (pot.soilMoisture !== null && pot.soilMoisture < soilThreshold) {
      alertsForPot.push({
        id: `${pot.id}-soil-low`,
        potId: pot.id,
        potName: pot.name,
        type: "deficit",
        title: "Déficit Hídrico Detectado",
        description: `La humedad del sustrato bajó al ${pot.soilMoisture}%. Se recomienda activar el riego programado.`,
        timestamp: "Ahora",
        resolved: resolvedAlertIds.has(`${pot.id}-soil-low`),
        metricInfo: {
          label: "Humedad Sustrato",
          value: `${pot.soilMoisture}%`,
          target: `Umbral: ${soilThreshold}%`,
        },
        suggestedAction: { label: "Ejecutar Riego (150ml)" },
      });
    }

    if (pot.airTemp !== null && pot.airTemp > tempThreshold) {
      alertsForPot.push({
        id: `${pot.id}-temp-high`,
        potId: pot.id,
        potName: pot.name,
        type: "temp",
        title: "Variación de Temperatura",
        description: `La temperatura del microclima alcanzó ${pot.airTemp}°C.`,
        timestamp: "Ahora",
        resolved: resolvedAlertIds.has(`${pot.id}-temp-high`),
        metricInfo: {
          label: "Temp. Aire",
          value: `${pot.airTemp} °C`,
          target: `Máx: ${tempThreshold} °C`,
        },
        suggestedAction: { label: "Activar Ventilación" },
      });
    }

    return alertsForPot;
  });
  const alerts = [...historicalAlerts, ...currentAlerts];

  const handleResolve = (id: string) => {
    setResolvedAlertIds((previous) => new Set(previous).add(id));
  };

  const handleTriggerAction = (alert: AlertItem) => {
    window.alert(
      `Acción ejecutada en ${alert.potName}: ${alert.suggestedAction?.label}`,
    );
    handleResolve(alert.id);
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "active") return !a.resolved;
    if (filter === "resolved") return a.resolved;
    return true;
  });

  const activeCount = alerts.filter((a) => !a.resolved).length;
  const resolvedCount = alerts.filter((a) => a.resolved).length;

  return (
    <div className="container-fluid p-0 text-white">
      {/* Encabezado */}
      <div className="mb-4">
        <h3 className="fw-bold text-white mb-1">
          Centro de Alertas & Incidentes
        </h3>
        <p
          className="text-secondary mb-0"
          style={{ color: "#94a3b8", fontSize: "14px" }}
        >
          Supervisión y respuesta rápida ante anomalías en el invernadero
        </p>
      </div>

      {/* Tarjetas KPI Interactivas (Sin bordes/marcos blancos) */}
      <div className="row g-3 mb-4">
        {/* Widget 1: Incidentes Activos */}
        <div className="col-12 col-md-4">
          <div
            className="alert-summary-widget p-3 rounded-4 cursor-pointer transition-all"
            style={{
              backgroundColor: "#131B2E",
              cursor: "pointer",
              border: "none",
            }}
            onClick={() => setFilter("active")}
            role="button"
            tabIndex={0}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span className="fw-bold text-white fs-6">
                  Incidentes Activos
                </span>
              </div>
              <span
                className="badge rounded-pill fw-normal px-3 py-1"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  fontSize: "12px",
                }}
              >
                Atención: Requerida
              </span>
            </div>

            <div className="d-flex align-items-baseline gap-2 mb-2">
              <span
                className="fw-bold text-white"
                style={{ fontSize: "2.5rem", lineHeight: "1" }}
              >
                {activeCount}
              </span>
              <span className="small" style={{ color: "#10b981" }}>
                nodos afectados
              </span>
            </div>

            <div
              className="pt-2 mt-2 border-top border-secondary border-opacity-25 d-flex justify-content-between text-secondary"
              style={{ fontSize: "13px" }}
            >
              <span>Estado: En Monitoreo</span>
              <span>Urgencia: Media</span>
            </div>
          </div>
        </div>

        {/* Widget 2: Eventos Hoy */}
        <div className="col-12 col-md-4">
          <div
            className="alert-summary-widget p-3 rounded-4 cursor-pointer transition-all"
            style={{
              backgroundColor: "#131B2E",
              cursor: "pointer",
              border: "none",
            }}
            onClick={() => setFilter("all")}
            role="button"
            tabIndex={0}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span className="fw-bold text-white fs-6">Eventos Hoy</span>
              </div>
              <span
                className="badge rounded-pill fw-normal px-3 py-1"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  fontSize: "12px",
                }}
              >
                Registro: 24h
              </span>
            </div>

            <div className="d-flex align-items-baseline gap-2 mb-2">
              <span
                className="fw-bold text-white"
                style={{ fontSize: "2.5rem", lineHeight: "1" }}
              >
                {alerts.length}
              </span>
              <span className="small" style={{ color: "#10b981" }}>
                alertas registradas
              </span>
            </div>

            <div
              className="pt-2 mt-2 border-top border-secondary border-opacity-25 d-flex justify-content-between text-secondary"
              style={{ fontSize: "13px" }}
            >
              <span>Canal: ESP32 Mesh</span>
              <span>Sincro: RTDB</span>
            </div>
          </div>
        </div>

        {/* Widget 3: Resueltas */}
        <div className="col-12 col-md-4">
          <div
            className="alert-summary-widget p-3 rounded-4 cursor-pointer transition-all"
            style={{
              backgroundColor: "#131B2E",
              cursor: "pointer",
              border: "none",
            }}
            onClick={() => setFilter("resolved")}
            role="button"
            tabIndex={0}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span className="fw-bold text-white fs-6">Resueltas</span>
              </div>
              <span
                className="badge rounded-pill fw-normal px-3 py-1"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  fontSize: "12px",
                }}
              >
                Estabilizado
              </span>
            </div>

            <div className="d-flex align-items-baseline gap-2 mb-2">
              <span
                className="fw-bold text-white"
                style={{ fontSize: "2.5rem", lineHeight: "1" }}
              >
                {resolvedCount}
              </span>
              <span className="small" style={{ color: "#10b981" }}>
                incidentes cerrados
              </span>
            </div>

            <div
              className="pt-2 mt-2 border-top border-secondary border-opacity-25 d-flex justify-content-between text-secondary"
              style={{ fontSize: "13px" }}
            >
              <span>Resolución: Manual/Auto</span>
              <span>Histórico: OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="row g-4">
        {/* Columna Izquierda: Lista de Alertas con scrollbar interno */}
        <div className="col-12 col-lg-8">
          {/* Filtros */}
          <div className="d-flex gap-2 mb-3 pb-2 overflow-auto">
            <button
              className="btn btn-sm px-3 py-1 text-white"
              style={{
                borderRadius: '20px',
                backgroundColor: filter === "all" ? "#0284C7" : "transparent",
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontSize: '12px',
                height: '36px',
              }}
              onClick={() => setFilter("all")}
            >
              Todas
            </button>
            <button
              className="btn btn-sm px-3 py-1 text-white"
              style={{
                borderRadius: '20px',
                backgroundColor: filter === "active" ? "#0284C7" : "transparent",
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontSize: '12px',
                height: '36px',
              }}
              onClick={() => setFilter("active")}
            >
              Pendientes
            </button>
            <button
              className="btn btn-sm px-3 py-1 text-white"
              style={{
                borderRadius: '20px',
                backgroundColor: filter === "resolved" ? "#0284C7" : "transparent",
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontSize: '12px',
                height: '36px',
              }}
              onClick={() => setFilter("resolved")}
            >
              Resueltas
            </button>
          </div>

          {/* CASILLA / CONTENEDOR CON SCROLL DEDICADO */}
          <div
            className="d-flex flex-column gap-2 pe-2"
            style={{
              maxHeight: "calc(100vh - 360px)", // O puedes usar '350px' para fijar una altura fija
              overflowY: "auto",
            }}
          >
            {filteredAlerts.length === 0 ? (
              <div
                className="p-4 rounded-3 text-center"
                style={{ backgroundColor: "#131B2E", color: "#94a3b8" }}
              >
                No hay alertas en esta categoría.
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-3"
                  style={{
                    backgroundColor: "#131B2E",
                    opacity: alert.resolved ? 0.65 : 1,
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className="badge fw-normal px-2 py-1"
                        style={{
                          backgroundColor: alert.resolved
                            ? "rgba(255, 255, 255, 0.08)"
                            : "rgba(16, 185, 129, 0.2)",
                          color: alert.resolved ? "#94a3b8" : "#10b981",
                        }}
                      >
                        {alert.resolved ? "Resuelto" : "Atención"}
                      </span>
                      <span className="fw-medium text-white">
                        {alert.potName}
                      </span>
                    </div>
                    <span className="small" style={{ color: "#94a3b8" }}>
                      {alert.timestamp}
                    </span>
                  </div>

                  <h5 className="fs-6 fw-bold text-white mb-1">
                    {alert.title}
                  </h5>
                  <p className="small mb-3" style={{ color: "#94a3b8" }}>
                    {alert.description}
                  </p>

                  <div
                    className="d-flex flex-wrap align-items-center justify-content-between pt-2 gap-2"
                    style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}
                  >
                    {alert.metricInfo && (
                      <div className="small">
                        <span style={{ color: "#94a3b8" }} className="me-2">
                          {alert.metricInfo.label}:
                        </span>
                        <span className="fw-bold text-white me-2">
                          {alert.metricInfo.value}
                        </span>
                        {alert.metricInfo.target && (
                          <span style={{ color: "#94a3b8", opacity: 0.8 }}>
                            ({alert.metricInfo.target})
                          </span>
                        )}
                      </div>
                    )}

                    <div className="d-flex gap-2 ms-auto">
                      {!alert.resolved && alert.suggestedAction && (
                        <button
                          type="button"
                          className="btn btn-sm px-3 rounded-2 text-white"
                          style={{
                            backgroundColor: "#131B2E",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                          }}
                          onClick={() => handleTriggerAction(alert)}
                        >
                          {alert.suggestedAction.label}
                        </button>
                      )}
                      {!alert.resolved && (
                        <button
                          type="button"
                          className="btn btn-sm px-3 rounded-2 text-white border-0"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                          }}
                          onClick={() => handleResolve(alert.id)}
                        >
                          Marcar resuelto
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel Lateral: Configuración */}
        <div className="col-12 col-lg-4">
          <div className="p-3 rounded-4" style={{ backgroundColor: "#131B2E" }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <h6 className="fw-bold text-white mb-0">
                Configuración de Umbrales
              </h6>
            </div>

            <div className="mb-4">
              <label
                className="form-label small d-flex justify-content-between mb-1"
                style={{ color: "#94a3b8" }}
              >
                <span>Alerta Humedad Mínima:</span>
                <span className="text-white fw-bold">{soilThreshold}%</span>
              </label>
              <input
                type="range"
                className="form-range"
                min="20"
                max="60"
                value={soilThreshold}
                onChange={(e) => setSoilThreshold(Number(e.target.value))}
              />
              <span
                className="d-block"
                style={{ color: "#94a3b8", fontSize: "12px" }}
              >
                Notifica cuando el suelo esté por debajo de este valor.
              </span>
            </div>

            <div className="mb-4">
              <label
                className="form-label small d-flex justify-content-between mb-1"
                style={{ color: "#94a3b8" }}
              >
                <span>Alerta Temp. Máxima:</span>
                <span className="text-white fw-bold">{tempThreshold}°C</span>
              </label>
              <input
                type="range"
                className="form-range"
                min="22"
                max="40"
                value={tempThreshold}
                onChange={(e) => setTempThreshold(Number(e.target.value))}
              />
              <span
                className="d-block"
                style={{ color: "#94a3b8", fontSize: "12px" }}
              >
                Notifica si el microclima supera este límite.
              </span>
            </div>

            <div
              className="my-3"
              style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}
            />

            <h6 className="fw-bold text-white mb-3">Canales de Notificación</h6>

            <div className="form-check form-switch mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="webNotifSwitch"
                checked={webNotif}
                onChange={(e) => setWebNotif(e.target.checked)}
              />
              <label
                className="form-check-label text-white small"
                htmlFor="webNotifSwitch"
              >
                Notificaciones Web Push
              </label>
            </div>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="telegramNotifSwitch"
                checked={telegramNotif}
                onChange={(e) => setTelegramNotif(e.target.checked)}
              />
              <label
                className="form-check-label text-white small"
                htmlFor="telegramNotifSwitch"
              >
                Bot Telegram AgroloT
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
