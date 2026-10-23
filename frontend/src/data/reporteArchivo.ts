import type { jsPDF } from 'jspdf';
import type { Reporte, TipoSensor } from '../types/contrato';

const NOMBRES_SENSOR: Record<string, string> = {
  HUMEDAD_SUELO: 'Humedad del suelo',
  TEMPERATURA: 'Temperatura del aire',
  HUMEDAD_AIRE: 'Humedad del aire',
  LUZ: 'Luz',
};

export const fechaGuatemala = new Intl.DateTimeFormat('es-GT', {
  timeZone: 'America/Guatemala',
  dateStyle: 'medium',
  timeStyle: 'short',
});

// Página A4 en milímetros.
const MARGEN = 18;
// Alto de una línea de 10.5 pt con interlineado 1.45 (1 pt = 0.3528 mm).
const ALTO_LINEA_CUERPO = 10.5 * 0.3528 * 1.45;
const COLOR_TEXTO: [number, number, number] = [30, 41, 59];
const COLOR_SECUNDARIO: [number, number, number] = [100, 116, 139];
const COLOR_ACENTO: [number, number, number] = [16, 185, 129];

export function nombreSensor(tipo: TipoSensor): string {
  return NOMBRES_SENSOR[tipo] ?? tipo;
}

/**
 * Las fuentes estándar del PDF solo cubren Latin-1: se cambian los signos tipográficos comunes
 * y se quitan los demás caracteres (emojis, etc.) para que no salgan símbolos raros.
 */
function textoPdf(texto: string): string {
  return texto
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[•·]/g, '-')
    .replace(/ | /g, ' ')
    .replace(/[^\n -ÿ]/g, '')
    // Quita el espacio que deja un emoji eliminado antes de un signo de puntuación.
    .replace(/ {2,}/g, ' ')
    .replace(/ +([.,;:])/g, '$1');
}

/** Quita el formato en línea de Markdown (negritas, cursivas, código) que no se dibuja. */
function sinFormato(texto: string): string {
  return textoPdf(texto
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(\S[^*]*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1'));
}

/** Escribe texto con salto de línea y de página. Devuelve la nueva posición vertical. */
function escribir(doc: jsPDF, texto: string, y: number, opciones: { tamano: number; negrita?: boolean; color?: [number, number, number]; sangria?: number; interlineado?: number }): number {
  const { tamano, negrita = false, color = COLOR_TEXTO, sangria = 0, interlineado = 1.45 } = opciones;
  const ancho = doc.internal.pageSize.getWidth() - MARGEN * 2 - sangria;
  const alto = doc.internal.pageSize.getHeight();
  const altoLinea = (tamano * 0.3528) * interlineado;
  doc.setFont('helvetica', negrita ? 'bold' : 'normal');
  doc.setFontSize(tamano);
  doc.setTextColor(...color);
  for (const linea of doc.splitTextToSize(texto, ancho) as string[]) {
    if (y + altoLinea > alto - MARGEN) {
      doc.addPage();
      y = MARGEN;
    }
    doc.text(linea, MARGEN + sangria, y + altoLinea * 0.75);
    y += altoLinea;
  }
  return y;
}

/** Dibuja el contenido Markdown de la IA: títulos, viñetas, listas numeradas y párrafos. */
function escribirMarkdown(doc: jsPDF, markdown: string, y: number): number {
  for (const lineaCruda of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const linea = lineaCruda.trimEnd();
    const titulo = linea.match(/^(#{1,6})\s+(.*)$/);
    const vineta = linea.match(/^\s*[-*+]\s+(.*)$/);
    const numerada = linea.match(/^\s*(\d+)[.)]\s+(.*)$/);

    if (!linea.trim()) {
      y += 2;
    } else if (titulo) {
      y += 4;
      y = escribir(doc, sinFormato(titulo[2]), y, { tamano: titulo[1].length <= 2 ? 13 : 11.5, negrita: true, color: COLOR_ACENTO });
      y += 1.5;
    } else if (vineta) {
      // Si la primera línea no cabe, se pasa de página antes para que el punto quede junto al texto.
      if (y + ALTO_LINEA_CUERPO > doc.internal.pageSize.getHeight() - MARGEN) {
        doc.addPage();
        y = MARGEN;
      }
      doc.setFillColor(...COLOR_ACENTO);
      doc.circle(MARGEN + 2.2, y + 2.9, 0.8, 'F');
      y = escribir(doc, sinFormato(vineta[1]), y, { tamano: 10.5, sangria: 6 });
      y += 1;
    } else if (numerada) {
      y = escribir(doc, `${numerada[1]}. ${sinFormato(numerada[2])}`, y, { tamano: 10.5, sangria: 4 });
      y += 1;
    } else {
      y = escribir(doc, sinFormato(linea), y, { tamano: 10.5 });
      y += 1;
    }
  }
  return y;
}

/** Arma el PDF del reporte: encabezado con los datos del reporte y el contenido de la IA. */
export async function reporteAPdf(reporte: Reporte, nombreMaceta: string): Promise<jsPDF> {
  // Se carga solo al exportar para no aumentar la carga inicial del dashboard.
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const ancho = doc.internal.pageSize.getWidth();
  const sinDatos = reporte.sensoresSinDatos.length
    ? reporte.sensoresSinDatos.map(nombreSensor).join(', ')
    : 'Ninguno';

  doc.setProperties({ title: textoPdf(`Reporte de IA - ${nombreMaceta}`), creator: 'AgroIoT' });

  let y = MARGEN;
  y = escribir(doc, 'AgroIoT', y, { tamano: 10, negrita: true, color: COLOR_ACENTO });
  y = escribir(doc, textoPdf(`Reporte de IA - ${nombreMaceta}`), y, { tamano: 18, negrita: true });
  y += 3;

  const datos: Array<[string, string]> = [
    ['Periodo', `${fechaGuatemala.format(new Date(reporte.desde))} - ${fechaGuatemala.format(new Date(reporte.hasta))} (hora de Guatemala)`],
    ['Sensores analizados', reporte.sensores.map(nombreSensor).join(', ') || 'Ninguno'],
    ['Sensores sin datos', sinDatos],
    ['Generado', `${fechaGuatemala.format(new Date(reporte.creadoEn))} con ${reporte.modelo}`],
  ];
  for (const [etiqueta, valor] of datos) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR_SECUNDARIO);
    doc.text(`${etiqueta}:`, MARGEN, y + 3.4);
    y = escribir(doc, textoPdf(valor), y, { tamano: 9.5, color: COLOR_TEXTO, sangria: 38 });
    y += 0.8;
  }

  y += 3;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(MARGEN, y, ancho - MARGEN, y);
  y += 2;

  escribirMarkdown(doc, reporte.contenido.trim(), y);

  // Pie de página con numeración.
  const paginas = doc.getNumberOfPages();
  const alto = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_SECUNDARIO);
    doc.text(textoPdf(`AgroIoT - ${nombreMaceta}`), MARGEN, alto - 8);
    doc.text(`Página ${i} de ${paginas}`, ancho - MARGEN, alto - 8, { align: 'right' });
  }
  return doc;
}

/** Descarga el reporte como archivo .pdf. */
export async function descargarReporte(reporte: Reporte, nombreMaceta: string): Promise<void> {
  const doc = await reporteAPdf(reporte, nombreMaceta);
  // en-CA da el formato AAAA-MM-DD, en la fecha de Guatemala.
  const fecha = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala' }).format(new Date(reporte.creadoEn));
  doc.save(`reporte-ia-${fecha}-${reporte.id}.pdf`);
}
