package com.agroiot.api.repository;

import java.util.List;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

import com.agroiot.api.entity.Alerta;

public interface AlertaRepository extends JpaRepository<Alerta, Long> {

	/** Alertas abiertas (resuelta_en null) del dispositivo. */
	List<Alerta> findByDispositivo_IdAndResueltaEnIsNull(String dispositivoId);

	/** GET ?estado=ACTIVA, más reciente primero. */
	List<Alerta> findByDispositivo_IdAndResueltaEnIsNullOrderByCreadaEnDescIdDesc(String dispositivoId,
			Limit limite);

	/** GET ?estado=TODAS, más reciente primero. */
	List<Alerta> findByDispositivo_IdOrderByCreadaEnDescIdDesc(String dispositivoId, Limit limite);

}
