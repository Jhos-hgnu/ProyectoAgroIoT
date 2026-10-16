package com.agroiot.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agroiot.api.entity.Lectura;

public interface LecturaRepository extends JpaRepository<Lectura, Long> {
}
