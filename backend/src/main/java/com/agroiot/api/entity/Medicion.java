package com.agroiot.api.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** Un valor de un sensor dentro de una lectura. */
@Entity
@Table(name = "medicion")
public class Medicion {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "lectura_id", nullable = false)
	private Lectura lectura;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "tipo_sensor", nullable = false)
	private TipoSensor tipo;

	@Column(nullable = false, precision = 8, scale = 2)
	private BigDecimal valor;

	protected Medicion() {
	}

	Medicion(Lectura lectura, TipoSensor tipo, BigDecimal valor) {
		this.lectura = lectura;
		this.tipo = tipo;
		this.valor = valor;
	}

	public Long getId() { return id; }
	public Lectura getLectura() { return lectura; }
	public TipoSensor getTipo() { return tipo; }
	public BigDecimal getValor() { return valor; }

}
