package com.agroiot.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.agroiot.api.entity.Dispositivo;

public interface DispositivoRepository extends JpaRepository<Dispositivo, String> {

	@Query("select d.id from Dispositivo d")
	List<String> findAllIds();

	List<Dispositivo> findAllByOrderByIdAsc();

}
