package com.agroiot.api.service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroiot.api.config.AppProperties;
import com.agroiot.api.dto.ReporteResponse;
import com.agroiot.api.dto.ReporteResumen;
import com.agroiot.api.entity.Dispositivo;
import com.agroiot.api.entity.ReporteIa;
import com.agroiot.api.entity.TipoSensor;
import com.agroiot.api.exception.ApiException;
import com.agroiot.api.repository.DispositivoRepository;
import com.agroiot.api.repository.ReporteDatosRepository;
import com.agroiot.api.repository.ReporteDatosRepository.AlertaVentana;
import com.agroiot.api.repository.ReporteDatosRepository.Hora;
import com.agroiot.api.repository.ReporteDatosRepository.Riegos;
import com.agroiot.api.repository.ReporteDatosRepository.Total;
import com.agroiot.api.repository.ReporteIaRepository;
import com.agroiot.api.repository.TipoSensorRepository;

import tools.jackson.databind.json.JsonMapper;

/**
 * Reportes de IA (ver "Reporte de IA con datos parciales" en el contrato): resume la ventana con los sensores que
 * tienen datos, se la envía a Gemini con el prompt del contrato y guarda el JSON enviado y la respuesta.
 * <p>
 * generar no abre una transacción: la llamada al modelo tarda segundos y no debe ocupar una conexión del pool
 * (Neon gratuito tiene pocas). Las consultas y el INSERT del final usan cada uno la suya.
 */
@Service
public class ReporteService {

	private static final Logger log = LoggerFactory.getLogger(ReporteService.class);

	static final int MINIMO_MEDICIONES = 10;
	private static final ZoneId GUATEMALA = ZoneId.of("America/Guatemala");
	private static final DateTimeFormatter FECHA_LOCAL = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

	/** Prompt del contrato. Se reemplaza a mano: las llaves del JSON romperían un PromptTemplate. */
	static final String PROMPT = """
			Eres un agrónomo que revisa una maceta monitoreada con sensores.
			Analiza SOLO los datos del JSON. Las horas están en hora de Guatemala.
			Sensores con datos: {sensores}.
			Sensores sin datos: {sensoresSinDatos}. Menciónalos una vez como no
			disponibles y no hagas suposiciones sobre ellos.
			Responde en español, en Markdown, con estas secciones:
			## Resumen (2 o 3 oraciones)
			## Hallazgos (viñetas con horas y valores concretos)
			## Riesgos
			## Recomendaciones (máximo 3, accionables)
			Datos:
			{json}
			""";

	private final DispositivoRepository dispositivos;
	private final TipoSensorRepository tiposSensor;
	private final ReporteDatosRepository datos;
	private final ReporteIaRepository reportes;
	private final ObjectProvider<ChatModel> modelo;
	private final AppProperties props;
	private final JsonMapper json;

	public ReporteService(DispositivoRepository dispositivos, TipoSensorRepository tiposSensor,
			ReporteDatosRepository datos, ReporteIaRepository reportes, ObjectProvider<ChatModel> modelo,
			AppProperties props, JsonMapper json) {
		this.dispositivos = dispositivos;
		this.tiposSensor = tiposSensor;
		this.datos = datos;
		this.reportes = reportes;
		this.modelo = modelo;
		this.props = props;
		this.json = json;
	}

	/** POST /dispositivos/{id}/reportes: últimas {horas} horas. 422 con menos de 10 mediciones, 502 si falla la IA. */
	public ReporteResponse generar(String dispositivoId, int horas) {
		Dispositivo d = dispositivos.findById(dispositivoId)
				.orElseThrow(() -> ApiException.dispositivoNoEncontrado(dispositivoId));
		Instant hasta = Instant.now().truncatedTo(ChronoUnit.SECONDS);
		Instant desde = hasta.minus(Duration.ofHours(horas));

		// 1 y 2. Solo aparecen los sensores con datos; con menos de 10 mediciones no hay nada que analizar.
		List<Total> totales = datos.totales(dispositivoId, desde, hasta);
		int muestras = totales.stream().mapToInt(Total::muestras).sum();
		if (muestras < MINIMO_MEDICIONES) {
			throw ApiException.datosInsuficientes("Hay " + muestras + " mediciones en las últimas " + horas
					+ " h; se necesitan al menos " + MINIMO_MEDICIONES);
		}
		List<String> sensores = totales.stream().map(Total::tipoSensor).toList();
		List<String> sinDatos = sinDatos(sensores);

		// 3. El JSON que se envía al modelo y se guarda en resumen_entrada.
		String entrada = json.writeValueAsString(resumen(d, desde, hasta, horas, sensores, sinDatos, totales));

		// 4. Prompt del contrato. Si el modelo falla no se guarda nada.
		String contenido = consultarModelo(PROMPT
				.replace("{sensores}", String.join(", ", sensores))
				.replace("{sensoresSinDatos}", sinDatos.isEmpty() ? "ninguno" : String.join(", ", sinDatos))
				.replace("{json}", entrada));

		ReporteIa r = reportes.save(new ReporteIa(d, desde, hasta, String.join(",", sensores), entrada, contenido,
				props.gemini().model()));
		log.info("Reporte #{} de {}: {} h, sensores {}", r.getId(), dispositivoId, horas, sensores);
		return aRespuesta(r);
	}

	/** GET /dispositivos/{id}/reportes, del más reciente al más antiguo, sin contenido. */
	@Transactional(readOnly = true)
	public List<ReporteResumen> listar(String dispositivoId, int limite) {
		if (!dispositivos.existsById(dispositivoId)) {
			throw ApiException.dispositivoNoEncontrado(dispositivoId);
		}
		return reportes.findByDispositivo_IdOrderByCreadoEnDescIdDesc(dispositivoId, Limit.of(limite)).stream()
				.map(r -> {
					List<String> sensores = sensores(r);
					return new ReporteResumen(r.getId(), r.getDesde(), r.getHasta(), sensores, sinDatos(sensores),
							r.getModelo(), r.getCreadoEn());
				})
				.toList();
	}

	/** GET /reportes/{id}. */
	@Transactional(readOnly = true)
	public ReporteResponse obtener(Long id) {
		return aRespuesta(reportes.findById(id).orElseThrow(() -> ApiException.reporteNoEncontrado(id)));
	}

	private String consultarModelo(String prompt) {
		ChatModel chat = modelo.getIfAvailable();
		if (chat == null) {
			throw ApiException.iaNoDisponible("La IA no está configurada (falta GEMINI_API_KEY)");
		}
		String texto;
		try {
			ChatResponse respuesta = chat.call(new Prompt(prompt));
			texto = respuesta == null || respuesta.getResult() == null ? null
					: respuesta.getResult().getOutput().getText();
		} catch (RuntimeException e) {
			Throwable causa = e;
			while (causa.getCause() != null && causa.getCause() != causa) {
				causa = causa.getCause();
			}
			// La causa raíz dice el motivo real: key inválida, cuota agotada (429), modelo inexistente...
			log.warn("Gemini falló: {} (causa: {})", e.getMessage(), causa.toString());
			throw ApiException.iaNoDisponible("El servicio de IA no respondió; intenta de nuevo en unos minutos");
		}
		if (texto == null || texto.isBlank()) {
			throw ApiException.iaNoDisponible("El servicio de IA respondió vacío");
		}
		return texto.strip();
	}

	private Map<String, Object> resumen(Dispositivo d, Instant desde, Instant hasta, int horas,
			List<String> sensores, List<String> sinDatos, List<Total> totales) {
		Map<String, Object> dispositivo = new LinkedHashMap<>();
		dispositivo.put("id", d.getId());
		dispositivo.put("nombre", d.getNombre());
		dispositivo.put("ubicacion", d.getUbicacion());
		dispositivo.put("tieneBomba", d.isTieneBomba());
		dispositivo.put("riegoAutomatico", d.isRiegoAutomatico());
		dispositivo.put("umbralRiegoSuelo", d.getUmbralRiego());

		Map<String, Object> ventana = new LinkedHashMap<>();
		ventana.put("desde", local(desde));
		ventana.put("hasta", local(hasta));
		ventana.put("horas", horas);

		List<Map<String, Object>> filasTotales = totales.stream().map(t -> {
			Map<String, Object> m = new LinkedHashMap<>();
			m.put("sensor", t.tipoSensor());
			m.put("unidad", t.unidad());
			m.put("promedio", t.promedio());
			m.put("minimo", t.minimo());
			m.put("maximo", t.maximo());
			m.put("muestras", t.muestras());
			return m;
		}).toList();

		Map<String, List<Map<String, Object>>> porHora = new LinkedHashMap<>();
		for (Hora h : datos.porHora(d.getId(), desde, hasta)) {
			Map<String, Object> m = new LinkedHashMap<>();
			m.put("hora", h.horaLocal().format(FECHA_LOCAL));
			m.put("promedio", h.promedio());
			m.put("minimo", h.minimo());
			m.put("maximo", h.maximo());
			m.put("muestras", h.muestras());
			porHora.computeIfAbsent(h.tipoSensor(), k -> new ArrayList<>()).add(m);
		}

		List<Map<String, Object>> riegos = datos.riegos(d.getId(), desde, hasta).stream().map((Riegos r) -> {
			Map<String, Object> m = new LinkedHashMap<>();
			m.put("origen", r.origen());
			m.put("estado", r.estado());
			m.put("total", r.total());
			return m;
		}).toList();

		List<Map<String, Object>> alertas = datos.alertas(d.getId(), desde, hasta).stream().map((AlertaVentana a) -> {
			Map<String, Object> m = new LinkedHashMap<>();
			m.put("sensor", a.tipoSensor());
			m.put("severidad", a.severidad());
			m.put("mensaje", a.mensaje());
			m.put("valor", a.valor());
			m.put("creada", fecha(a.creadaLocal()));
			m.put("resuelta", fecha(a.resueltaLocal()));
			return m;
		}).toList();

		Map<String, Object> r = new LinkedHashMap<>();
		r.put("dispositivo", dispositivo);
		r.put("ventana", ventana);
		r.put("sensoresConDatos", sensores);
		r.put("sensoresSinDatos", sinDatos);
		r.put("totales", filasTotales);
		r.put("resumenPorHora", porHora);
		r.put("riegos", riegos);
		r.put("alertas", alertas);
		return r;
	}

	/** Tipos del catálogo que no están en la lista, en orden alfabético. */
	private List<String> sinDatos(List<String> sensores) {
		return tiposSensor.findAll().stream()
				.map(TipoSensor::getCodigo)
				.filter(codigo -> !sensores.contains(codigo))
				.sorted()
				.toList();
	}

	private ReporteResponse aRespuesta(ReporteIa r) {
		List<String> sensores = sensores(r);
		return new ReporteResponse(r.getId(), r.getDesde(), r.getHasta(), sensores, sinDatos(sensores),
				r.getContenido(), r.getModelo(), r.getCreadoEn());
	}

	private static List<String> sensores(ReporteIa r) {
		return Arrays.stream(r.getSensores().split(",")).filter(s -> !s.isBlank()).toList();
	}

	private static String local(Instant instante) {
		return instante.atZone(GUATEMALA).toLocalDateTime().format(FECHA_LOCAL);
	}

	private static String fecha(LocalDateTime local) {
		return local == null ? null : local.format(FECHA_LOCAL);
	}

}
