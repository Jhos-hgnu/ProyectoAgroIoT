package com.agroiot.api.service;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroiot.api.dto.Agrupacion;
import com.agroiot.api.dto.MedicionesResponse;
import com.agroiot.api.dto.Punto;
import com.agroiot.api.dto.Serie;
import com.agroiot.api.entity.TipoSensor;
import com.agroiot.api.exception.ApiException;
import com.agroiot.api.repository.DispositivoRepository;
import com.agroiot.api.repository.SerieRepository;
import com.agroiot.api.repository.TipoSensorRepository;

/** GET /dispositivos/{id}/mediciones: series para las gráficas. */
@Service
public class MedicionService {

	/** Ventana por defecto cuando no llegan desde/hasta. */
	private static final Duration VENTANA_POR_DEFECTO = Duration.ofHours(24);
	/** Sin agrupar llega un punto cada 10 s: 24 h son ~8 600 puntos por sensor (~1,3 MB con 4 sensores). */
	private static final Duration MAXIMO_SIN_AGRUPAR = Duration.ofHours(24);
	/** Por hora, 31 días son 744 puntos por sensor. */
	private static final Duration MAXIMO_POR_HORA = Duration.ofDays(31);

	private final DispositivoRepository dispositivos;
	private final TipoSensorRepository tiposSensor;
	private final SerieRepository series;

	public MedicionService(DispositivoRepository dispositivos, TipoSensorRepository tiposSensor,
			SerieRepository series) {
		this.dispositivos = dispositivos;
		this.tiposSensor = tiposSensor;
		this.series = series;
	}

	@Transactional(readOnly = true)
	public MedicionesResponse consultar(String id, Instant desde, Instant hasta, List<String> tipos,
			Agrupacion agrupacion) {
		if (!dispositivos.existsById(id)) {
			throw ApiException.dispositivoNoEncontrado(id);
		}

		// Rango: por defecto las últimas 24 h; si solo llega uno de los dos, el otro se calcula.
		Instant fin = hasta != null ? hasta : Instant.now().truncatedTo(ChronoUnit.SECONDS);
		Instant inicio = desde != null ? desde : fin.minus(VENTANA_POR_DEFECTO);
		if (!inicio.isBefore(fin)) {
			throw ApiException.validacion("desde debe ser anterior a hasta");
		}
		Duration rango = Duration.between(inicio, fin);
		if (agrupacion == Agrupacion.NINGUNA && rango.compareTo(MAXIMO_SIN_AGRUPAR) > 0) {
			throw ApiException.validacion("Sin agrupar el rango máximo es de " + MAXIMO_SIN_AGRUPAR.toHours()
					+ " h; usa agrupacion=HORA para rangos mayores");
		}
		if (agrupacion == Agrupacion.HORA && rango.compareTo(MAXIMO_POR_HORA) > 0) {
			throw ApiException.validacion("Por hora el rango máximo es de " + MAXIMO_POR_HORA.toDays() + " días");
		}

		Map<String, TipoSensor> catalogo = tiposSensor.findAll().stream()
				.collect(Collectors.toMap(TipoSensor::getCodigo, Function.identity()));
		Set<String> filtro = normalizarTipos(tipos, catalogo);

		// Las filas vienen ordenadas por tipo y fecha: se agrupan en una serie por tipo, en ese orden.
		Map<String, List<Punto>> puntosPorTipo = new LinkedHashMap<>();
		for (SerieRepository.Fila f : series.buscar(id, inicio, fin, filtro, agrupacion == Agrupacion.HORA)) {
			puntosPorTipo.computeIfAbsent(f.tipoSensor(), t -> new ArrayList<>())
					.add(new Punto(f.t(), f.valor(), f.minimo(), f.maximo()));
		}
		List<Serie> resultado = puntosPorTipo.entrySet().stream()
				.map(e -> new Serie(e.getKey(), catalogo.get(e.getKey()).getUnidad(), e.getValue()))
				.toList();

		return new MedicionesResponse(id, inicio, fin, agrupacion, resultado);
	}

	/** tipos=HUMEDAD_SUELO,TEMPERATURA → conjunto validado contra el catálogo. Vacío = todos. */
	private static Set<String> normalizarTipos(List<String> tipos, Map<String, TipoSensor> catalogo) {
		Set<String> filtro = new LinkedHashSet<>();
		if (tipos == null) {
			return filtro;
		}
		for (String t : tipos) {
			String codigo = t.trim().toUpperCase();
			if (codigo.isEmpty()) {
				continue;
			}
			if (!catalogo.containsKey(codigo)) {
				throw ApiException.validacion("Tipo de sensor desconocido: " + t.trim()
						+ ". Válidos: " + String.join(", ", new TreeSet<>(catalogo.keySet())));
			}
			filtro.add(codigo);
		}
		return filtro;
	}

}
