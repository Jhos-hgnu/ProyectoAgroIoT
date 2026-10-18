package com.agroiot.api.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.List;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Series de mediciones para las gráficas (consultas 1 y 4 de db/consultas.sql, sobre la vista v_medicion).
 * Va con JDBC y no con JPA porque son agregados con date_trunc que no corresponden a ninguna entidad.
 */
@Repository
public class SerieRepository {

	/** Una fila de la serie. minimo y maximo solo vienen al agrupar por hora. */
	public record Fila(String tipoSensor, Instant t, BigDecimal valor, BigDecimal minimo, BigDecimal maximo) {
	}

	/** Consulta 4: valores sin agrupar en [desde, hasta]. */
	private static final String SIN_AGRUPAR = """
			SELECT tipo_sensor, medida_en AS t, valor, NULL AS minimo, NULL AS maximo
			FROM v_medicion
			WHERE dispositivo_id = :dispositivoId
			  AND medida_en BETWEEN :desde AND :hasta
			  %s
			ORDER BY tipo_sensor, medida_en
			""";

	/**
	 * Consulta 1 con rango en vez de horas: promedio, mínimo y máximo por hora. La hora se corta en hora de
	 * Guatemala y se devuelve como instante (UTC), igual que el resto de fechas de la API.
	 */
	private static final String POR_HORA = """
			SELECT tipo_sensor,
			       date_trunc('hour', medida_en AT TIME ZONE 'America/Guatemala') AT TIME ZONE 'America/Guatemala' AS t,
			       ROUND(AVG(valor), 2) AS valor,
			       MIN(valor)           AS minimo,
			       MAX(valor)           AS maximo
			FROM v_medicion
			WHERE dispositivo_id = :dispositivoId
			  AND medida_en BETWEEN :desde AND :hasta
			  %s
			GROUP BY tipo_sensor, t
			ORDER BY tipo_sensor, t
			""";

	private static final String FILTRO_TIPOS = "AND tipo_sensor IN (:tipos)";

	private static final RowMapper<Fila> FILA = (rs, n) -> new Fila(
			rs.getString("tipo_sensor"),
			rs.getObject("t", OffsetDateTime.class).toInstant(),
			rs.getBigDecimal("valor"),
			rs.getBigDecimal("minimo"),
			rs.getBigDecimal("maximo"));

	private final NamedParameterJdbcTemplate jdbc;

	public SerieRepository(NamedParameterJdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	/** Filas ordenadas por tipo y fecha. tipos vacío = todos los sensores. */
	public List<Fila> buscar(String dispositivoId, Instant desde, Instant hasta, Collection<String> tipos,
			boolean porHora) {
		MapSqlParameterSource params = new MapSqlParameterSource()
				.addValue("dispositivoId", dispositivoId)
				.addValue("desde", desde.atOffset(ZoneOffset.UTC))
				.addValue("hasta", hasta.atOffset(ZoneOffset.UTC))
				.addValue("tipos", tipos);
		String sql = (porHora ? POR_HORA : SIN_AGRUPAR).formatted(tipos.isEmpty() ? "" : FILTRO_TIPOS);
		return jdbc.query(sql, params, FILA);
	}

}
