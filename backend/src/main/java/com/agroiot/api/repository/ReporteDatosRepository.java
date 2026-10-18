package com.agroiot.api.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Datos de la ventana de un reporte de IA (consultas 1, 2 y 3 de db/consultas.sql, más las alertas).
 * Usan desde/hasta en vez de now() - horas para que todas vean la misma ventana. Las horas se cortan y se
 * devuelven en hora de Guatemala, que es como las lee el modelo.
 */
@Repository
public class ReporteDatosRepository {

	public record Hora(String tipoSensor, LocalDateTime horaLocal, BigDecimal promedio, BigDecimal minimo,
			BigDecimal maximo, int muestras) {
	}

	public record Total(String tipoSensor, String unidad, BigDecimal promedio, BigDecimal minimo,
			BigDecimal maximo, int muestras) {
	}

	public record Riegos(String origen, String estado, int total) {
	}

	public record AlertaVentana(String tipoSensor, String severidad, String mensaje, BigDecimal valor,
			LocalDateTime creadaLocal, LocalDateTime resueltaLocal) {
	}

	/** Consulta 1: resumen por hora y sensor. Solo aparecen los sensores con datos. */
	private static final String POR_HORA = """
			SELECT tipo_sensor,
			       date_trunc('hour', medida_en AT TIME ZONE 'America/Guatemala') AS hora_local,
			       ROUND(AVG(valor), 2) AS promedio,
			       MIN(valor)           AS minimo,
			       MAX(valor)           AS maximo,
			       COUNT(*)             AS muestras
			FROM v_medicion
			WHERE dispositivo_id = :dispositivoId
			  AND medida_en BETWEEN :desde AND :hasta
			GROUP BY tipo_sensor, hora_local
			ORDER BY tipo_sensor, hora_local
			""";

	/** Consulta 2: totales de la ventana por sensor, con su unidad. */
	private static final String TOTALES = """
			SELECT m.tipo_sensor,
			       t.unidad,
			       ROUND(AVG(m.valor), 2) AS promedio,
			       MIN(m.valor)           AS minimo,
			       MAX(m.valor)           AS maximo,
			       COUNT(*)               AS muestras
			FROM v_medicion m
			JOIN tipo_sensor t ON t.codigo = m.tipo_sensor
			WHERE m.dispositivo_id = :dispositivoId
			  AND m.medida_en BETWEEN :desde AND :hasta
			GROUP BY m.tipo_sensor, t.unidad
			ORDER BY m.tipo_sensor
			""";

	/** Consulta 3: riegos de la ventana por origen y estado. */
	private static final String RIEGOS = """
			SELECT origen, estado, COUNT(*) AS total
			FROM comando_riego
			WHERE dispositivo_id = :dispositivoId
			  AND creado_en BETWEEN :desde AND :hasta
			GROUP BY origen, estado
			ORDER BY origen, estado
			""";

	/** Alertas creadas en la ventana, de la más antigua a la más reciente. */
	private static final String ALERTAS = """
			SELECT tipo_sensor, severidad, mensaje, valor,
			       creada_en AT TIME ZONE 'America/Guatemala'   AS creada_local,
			       resuelta_en AT TIME ZONE 'America/Guatemala' AS resuelta_local
			FROM alerta
			WHERE dispositivo_id = :dispositivoId
			  AND creada_en BETWEEN :desde AND :hasta
			ORDER BY creada_en, id
			""";

	private final NamedParameterJdbcTemplate jdbc;

	public ReporteDatosRepository(NamedParameterJdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	public List<Hora> porHora(String dispositivoId, Instant desde, Instant hasta) {
		return jdbc.query(POR_HORA, params(dispositivoId, desde, hasta), (rs, n) -> new Hora(
				rs.getString("tipo_sensor"),
				rs.getObject("hora_local", LocalDateTime.class),
				rs.getBigDecimal("promedio"),
				rs.getBigDecimal("minimo"),
				rs.getBigDecimal("maximo"),
				rs.getInt("muestras")));
	}

	public List<Total> totales(String dispositivoId, Instant desde, Instant hasta) {
		return jdbc.query(TOTALES, params(dispositivoId, desde, hasta), (rs, n) -> new Total(
				rs.getString("tipo_sensor"),
				rs.getString("unidad"),
				rs.getBigDecimal("promedio"),
				rs.getBigDecimal("minimo"),
				rs.getBigDecimal("maximo"),
				rs.getInt("muestras")));
	}

	public List<Riegos> riegos(String dispositivoId, Instant desde, Instant hasta) {
		return jdbc.query(RIEGOS, params(dispositivoId, desde, hasta), (rs, n) -> new Riegos(
				rs.getString("origen"),
				rs.getString("estado"),
				rs.getInt("total")));
	}

	public List<AlertaVentana> alertas(String dispositivoId, Instant desde, Instant hasta) {
		return jdbc.query(ALERTAS, params(dispositivoId, desde, hasta), (rs, n) -> new AlertaVentana(
				rs.getString("tipo_sensor"),
				rs.getString("severidad"),
				rs.getString("mensaje"),
				rs.getBigDecimal("valor"),
				rs.getObject("creada_local", LocalDateTime.class),
				rs.getObject("resuelta_local", LocalDateTime.class)));
	}

	private static MapSqlParameterSource params(String dispositivoId, Instant desde, Instant hasta) {
		return new MapSqlParameterSource()
				.addValue("dispositivoId", dispositivoId)
				.addValue("desde", desde.atOffset(ZoneOffset.UTC))
				.addValue("hasta", hasta.atOffset(ZoneOffset.UTC));
	}

}
