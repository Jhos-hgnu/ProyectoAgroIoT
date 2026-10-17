package com.agroiot.api.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.agroiot.api.entity.ComandoRiego;
import com.agroiot.api.entity.EstadoComando;

public interface ComandoRiegoRepository extends JpaRepository<ComandoRiego, Long> {

	Optional<ComandoRiego> findFirstByDispositivo_IdAndEstadoOrderByCreadoEnAsc(String dispositivoId,
			EstadoComando estado);

	boolean existsByDispositivo_IdAndEstadoIn(String dispositivoId, Collection<EstadoComando> estados);

	/** Historial de riegos, del más reciente al más antiguo. */
	List<ComandoRiego> findByDispositivo_IdOrderByCreadoEnDescIdDesc(String dispositivoId, Limit limite);

	/** Consulta 6 de db/consultas.sql: expira comandos abiertos de más de 2 minutos. */
	@Modifying(flushAutomatically = true, clearAutomatically = true)
	@Query(value = """
			UPDATE comando_riego
			SET estado = 'EXPIRADO', finalizado_en = now()
			WHERE dispositivo_id = :dispositivoId
			  AND estado IN ('PENDIENTE', 'ENVIADO')
			  AND creado_en < now() - INTERVAL '2 minutes'
			""", nativeQuery = true)
	int expirarAbiertos(@Param("dispositivoId") String dispositivoId);

	/**
	 * Consulta 7 de db/consultas.sql: ¿se puede regar automáticamente? No hay comando abierto y el último
	 * se creó hace más de espera_riego_min minutos.
	 */
	@Query(value = """
			SELECT NOT EXISTS (
			    SELECT 1
			    FROM comando_riego c
			    JOIN dispositivo d ON d.id = c.dispositivo_id
			    WHERE c.dispositivo_id = :dispositivoId
			      AND (c.estado IN ('PENDIENTE', 'ENVIADO')
			           OR c.creado_en > now() - make_interval(mins => d.espera_riego_min))
			)
			""", nativeQuery = true)
	boolean puedeRegarAutomaticamente(@Param("dispositivoId") String dispositivoId);

}
