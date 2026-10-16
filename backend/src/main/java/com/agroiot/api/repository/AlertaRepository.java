package com.agroiot.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroiot.api.entity.Alerta;

public interface AlertaRepository extends JpaRepository<Alerta, Long> {
}
