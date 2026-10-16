package com.agroiot.api.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Catálogo de tipos de sensor (HUMEDAD_SUELO, TEMPERATURA...). */
@Entity
@Table(name = "tipo_sensor")
public class TipoSensor {

	@Id
	@Column(length = 30)
	private String codigo;

	@Column(nullable = false, length = 60)
	private String nombre;

	@Column(nullable = false, length = 10)
	private String unidad;

	@Column(name = "valor_min", nullable = false, precision = 8, scale = 2)
	private BigDecimal valorMin;

	@Column(name = "valor_max", nullable = false, precision = 8, scale = 2)
	private BigDecimal valorMax;

	@Column(length = 60)
	private String componente;

	protected TipoSensor() {
	}

	/** true si el valor está dentro del rango físico válido (inclusive). */
	public boolean enRango(BigDecimal valor) {
		return valor.compareTo(valorMin) >= 0 && valor.compareTo(valorMax) <= 0;
	}

	public String getCodigo() { return codigo; }
	public String getNombre() { return nombre; }
	public String getUnidad() { return unidad; }
	public BigDecimal getValorMin() { return valorMin; }
	public BigDecimal getValorMax() { return valorMax; }
	public String getComponente() { return componente; }

}
