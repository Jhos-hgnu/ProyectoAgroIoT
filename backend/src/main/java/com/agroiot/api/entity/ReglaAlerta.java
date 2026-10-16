package com.agroiot.api.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** Regla de alerta configurable: umbral por tipo de sensor. */
@Entity
@Table(name = "regla_alerta")
public class ReglaAlerta {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "tipo_sensor", nullable = false)
	private TipoSensor tipo;

	/** "<" o ">". */
	@Column(nullable = false, length = 2)
	private String operador;

	@Column(nullable = false, precision = 8, scale = 2)
	private BigDecimal umbral;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 12)
	private Severidad severidad;

	@Column(nullable = false, length = 160)
	private String mensaje;

	@Column(nullable = false)
	private boolean activa = true;

	protected ReglaAlerta() {
	}

	public Integer getId() { return id; }
	public TipoSensor getTipo() { return tipo; }
	public String getOperador() { return operador; }
	public BigDecimal getUmbral() { return umbral; }
	public Severidad getSeveridad() { return severidad; }
	public String getMensaje() { return mensaje; }
	public boolean isActiva() { return activa; }

}
