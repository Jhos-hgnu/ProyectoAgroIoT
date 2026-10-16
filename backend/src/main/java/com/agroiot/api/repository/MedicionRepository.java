package com.agroiot.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroiot.api.entity.Medicion;

public interface MedicionRepository extends JpaRepository<Medicion, Long> {
}
