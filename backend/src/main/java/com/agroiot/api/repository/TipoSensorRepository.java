package com.agroiot.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroiot.api.entity.TipoSensor;

public interface TipoSensorRepository extends JpaRepository<TipoSensor, String> {
}
