package com.agroiot.api.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.agroiot.api.entity.DispositivoSensor;
import com.agroiot.api.entity.DispositivoSensorId;

public interface DispositivoSensorRepository extends JpaRepository<DispositivoSensor, DispositivoSensorId> {

	@Query("""
			select ds from DispositivoSensor ds
			join fetch ds.tipo
			where ds.id.dispositivoId = :dispositivoId
			order by ds.id.tipoSensor
			""")
	List<DispositivoSensor> findConTipoByDispositivoId(@Param("dispositivoId") String dispositivoId);

	/** Consulta 5 de db/consultas.sql: upsert de sensores detectados. */
	@Modifying
	@Query(value = """
			INSERT INTO dispositivo_sensor (dispositivo_id, tipo_sensor, primera_lectura, ultima_lectura, ultimo_valor)
			VALUES (:dispositivoId, :tipoSensor, :medidaEn, :medidaEn, :valor)
			ON CONFLICT (dispositivo_id, tipo_sensor)
			DO UPDATE SET ultima_lectura = GREATEST(dispositivo_sensor.ultima_lectura, EXCLUDED.ultima_lectura),
			              ultimo_valor   = CASE WHEN EXCLUDED.ultima_lectura >= dispositivo_sensor.ultima_lectura
			                                    THEN EXCLUDED.ultimo_valor
			                                    ELSE dispositivo_sensor.ultimo_valor END
			""", nativeQuery = true)
	void upsert(@Param("dispositivoId") String dispositivoId, @Param("tipoSensor") String tipoSensor,
			@Param("medidaEn") Instant medidaEn, @Param("valor") BigDecimal valor);

}
