package com.agroiot.api.repository;

import java.util.List;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

import com.agroiot.api.entity.ReporteIa;

public interface ReporteIaRepository extends JpaRepository<ReporteIa, Long> {

	/** GET /dispositivos/{id}/reportes, del más reciente al más antiguo. */
	List<ReporteIa> findByDispositivo_IdOrderByCreadoEnDescIdDesc(String dispositivoId, Limit limite);

}
