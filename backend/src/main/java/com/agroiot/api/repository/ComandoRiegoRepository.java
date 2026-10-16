package com.agroiot.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.agroiot.api.entity.ComandoRiego;
import com.agroiot.api.entity.EstadoComando;

public interface ComandoRiegoRepository extends JpaRepository<ComandoRiego, Long> {

	Optional<ComandoRiego> findFirstByDispositivo_IdAndEstadoOrderByCreadoEnAsc(String dispositivoId,
			EstadoComando estado);

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

}
