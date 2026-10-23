import React, { useEffect, useState } from 'react';
import type { Reporte } from '../../types/contrato';
import { descargarReporte, fechaGuatemala, nombreSensor } from '../../data/reporteArchivo';

interface ReportePreviewModalProps {
  reporte: Reporte;
  nombreMaceta: string;
  onClose: () => void;
}

/** Negritas (**texto**) dentro de una línea; el resto del formato en línea se muestra como texto. */
function enLinea(texto: string): React.ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**') && parte.length > 4
      ? <strong key={i} className="text-white">{parte.slice(2, -2)}</strong>
      : parte,
  );
}

/**
 * Markdown del reporte como elementos de React: títulos, viñetas, listas numeradas y párrafos.
 * No usa HTML crudo, así que el texto de la IA no puede inyectar etiquetas.
 */
function MarkdownReporte({ contenido }: { contenido: string }) {
  const bloques: React.ReactNode[] = [];
  // El cast evita que TypeScript la fije en null: cerrarLista() la cambia desde un closure.
  let lista = null as { tipo: 'ul' | 'ol'; items: string[] } | null;

  const cerrarLista = () => {
    if (!lista) return;
    const Etiqueta = lista.tipo;
    bloques.push(
      <Etiqueta key={bloques.length} className="mb-3 ps-4" style={{ fontSize: '14px', color: '#CBD5E1' }}>
        {lista.items.map((item, i) => <li key={i} className="mb-1">{enLinea(item)}</li>)}
      </Etiqueta>,
    );
    lista = null;
  };

  for (const lineaCruda of contenido.replace(/\r\n/g, '\n').split('\n')) {
    const linea = lineaCruda.trim();
    const titulo = linea.match(/^(#{1,6})\s+(.*)$/);
    const vineta = linea.match(/^[-*+]\s+(.*)$/);
    const numerada = linea.match(/^\d+[.)]\s+(.*)$/);

    if (vineta || numerada) {
      const tipo = vineta ? 'ul' : 'ol';
      if (lista?.tipo !== tipo) cerrarLista();
      lista ??= { tipo, items: [] };
      lista.items.push((vineta ?? numerada)![1]);
      continue;
    }
    cerrarLista();
    if (!linea) continue;
    if (titulo) {
      // div con role="heading": index.css fuerza el color de h1–h6 y aquí el título va en verde.
      bloques.push(
        <div key={bloques.length} role="heading" aria-level={3} className="fw-bold mt-3 mb-2" style={{ color: '#10B981', fontSize: titulo[1].length <= 2 ? '15px' : '14px' }}>
          {enLinea(titulo[2])}
        </div>,
      );
    } else {
      bloques.push(
        <p key={bloques.length} className="mb-2" style={{ fontSize: '14px', color: '#CBD5E1', lineHeight: 1.55 }}>
          {enLinea(linea)}
        </p>,
      );
    }
  }
  cerrarLista();
  return <>{bloques}</>;
}

/** Vista previa del reporte de IA con botón para descargarlo en PDF. */
export const ReportePreviewModal: React.FC<ReportePreviewModalProps> = ({ reporte, nombreMaceta, onClose }) => {
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cerrar con Escape.
  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [onClose]);

  const handleDescargar = async () => {
    setDescargando(true);
    setError(null);
    try {
      await descargarReporte(reporte, nombreMaceta);
    } catch (errorPdf) {
      console.error('No se pudo generar el PDF del reporte:', errorPdf);
      setError('No se pudo crear el PDF. Inténtalo de nuevo.');
    } finally {
      setDescargando(false);
    }
  };

  const datos: Array<[string, string]> = [
    ['Periodo', `${fechaGuatemala.format(new Date(reporte.desde))} – ${fechaGuatemala.format(new Date(reporte.hasta))}`],
    ['Generado', `${fechaGuatemala.format(new Date(reporte.creadoEn))} • ${reporte.modelo}`],
  ];

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(5, 10, 20, 0.75)', zIndex: 1050, backdropFilter: 'blur(4px)', cursor: 'pointer' }}
    >
      <div
        className="w-100 mx-3 rounded-4 border border-secondary border-opacity-25 shadow-lg overflow-hidden d-flex flex-column"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reporte-preview-titulo"
        style={{ maxWidth: '720px', maxHeight: 'calc(100vh - 48px)', backgroundColor: '#131B2E', color: '#FFFFFF', cursor: 'default' }}
      >
        {/* ENCABEZADO */}
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom border-secondary border-opacity-10">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center shrink-0"
              style={{ width: '40px', height: '40px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="8" y1="13" x2="16" y2="13"/>
                <line x1="8" y1="17" x2="13" y2="17"/>
              </svg>
            </div>
            <div>
              <h6 id="reporte-preview-titulo" className="fw-bold text-white mb-0" style={{ fontSize: '16px' }}>
                Reporte de IA — {nombreMaceta}
              </h6>
              <small style={{ fontSize: '11px', color: '#94A3B8' }}>Hora de Guatemala</small>
            </div>
          </div>

          <button type="button" className="btn p-1 text-secondary shadow-none border-0" onClick={onClose} aria-label="Cerrar" style={{ cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* CONTENIDO CON SCROLL */}
        <div className="p-4 overflow-auto custom-scrollbar" style={{ flex: 1, minHeight: 0 }}>
          <div className="d-flex flex-column gap-1 mb-3" style={{ fontSize: '12px' }}>
            {datos.map(([etiqueta, valor]) => (
              <div key={etiqueta}>
                <span className="fw-semibold me-2" style={{ color: '#94A3B8' }}>{etiqueta}:</span>
                <span style={{ color: '#CBD5E1' }}>{valor}</span>
              </div>
            ))}
            <div className="d-flex flex-wrap gap-2 mt-2">
              {reporte.sensores.map((tipo) => (
                <span key={tipo} className="badge rounded-pill fw-semibold" style={{ fontSize: '11px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '5px 10px' }}>
                  {nombreSensor(tipo)}
                </span>
              ))}
              {reporte.sensoresSinDatos.map((tipo) => (
                <span key={tipo} className="badge rounded-pill fw-semibold" style={{ fontSize: '11px', backgroundColor: '#334155', color: '#94A3B8', padding: '5px 10px' }}>
                  {nombreSensor(tipo)} • sin datos
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 border-top border-secondary border-opacity-10">
            <MarkdownReporte contenido={reporte.contenido} />
          </div>
        </div>

        {/* ACCIONES */}
        <div className="p-4 pt-3 border-top border-secondary border-opacity-10">
          {error && (
            <div className="alert alert-warning py-2 mb-3" role="alert" style={{ fontSize: '12px' }}>{error}</div>
          )}
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn flex-fill py-2.5 fw-medium text-white border border-secondary border-opacity-25 rounded-3"
              style={{ backgroundColor: '#1E293B', fontSize: '13px' }}
              onClick={onClose}
            >
              Cerrar
            </button>
            <button
              type="button"
              className="btn flex-fill py-2.5 fw-semibold text-white border-0 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
              style={{ backgroundColor: '#10B981', fontSize: '13px', cursor: descargando ? 'wait' : 'pointer' }}
              onClick={() => void handleDescargar()}
              disabled={descargando}
            >
              {descargando ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '14px', height: '14px' }}></span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
              <span>{descargando ? 'Creando PDF…' : 'Descargar PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
