package com.agroiot.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroiot.api.entity.Dispositivo;

public interface DispositivoRepository extends JpaRepository<Dispositivo, String> {
}
