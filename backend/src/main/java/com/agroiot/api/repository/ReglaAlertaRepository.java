package com.agroiot.api.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.agroiot.api.entity.ReglaAlerta;

public interface ReglaAlertaRepository extends JpaRepository<ReglaAlerta, Integer> {

	/** Reglas activas de los tipos de sensor indicados. */
	@Query("""
			select r from ReglaAlerta r
			join fetch r.tipo t
			where r.activa = true and t.codigo in :tipos
			""")
	List<ReglaAlerta> findActivasDeTipos(@Param("tipos") Collection<String> tipos);

}
