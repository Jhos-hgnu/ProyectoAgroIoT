package com.agroiot.api.entity;

import java.math.BigDecimal;
import java.time.Instant;

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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/** Alerta generada. resueltaEn null = alerta activa. */
@Entity
@Table(name = "alerta")
public class Alerta {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "dispositivo_id", nullable = false)
	private Dispositivo dispositivo;

	/** null = alerta del sistema (p. ej. riego fallido). */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "regla_id")
	private ReglaAlerta regla;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "tipo_sensor")
	private TipoSensor tipo;

	@Column(precision = 8, scale = 2)
	private BigDecimal valor;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 12)
	private Severidad severidad;

	@Column(nullable = false, length = 200)
	private String mensaje;

	@Column(name = "creada_en", nullable = false)
	private Instant creadaEn;

	@Column(name = "resuelta_en")
	private Instant resueltaEn;

	protected Alerta() {
	}

	public Alerta(Dispositivo dispositivo, ReglaAlerta regla, TipoSensor tipo, BigDecimal valor,
			Severidad severidad, String mensaje) {
		this.dispositivo = dispositivo;
		this.regla = regla;
		this.tipo = tipo;
		this.valor = valor;
		this.severidad = severidad;
		this.mensaje = mensaje;
	}

	@PrePersist
	void alCrear() {
		if (creadaEn == null) {
			creadaEn = Instant.now();
		}
	}

	public Long getId() { return id; }
	public Dispositivo getDispositivo() { return dispositivo; }
	public ReglaAlerta getRegla() { return regla; }
	public TipoSensor getTipo() { return tipo; }
	public BigDecimal getValor() { return valor; }
	public Severidad getSeveridad() { return severidad; }
	public String getMensaje() { return mensaje; }
	public Instant getCreadaEn() { return creadaEn; }
	public Instant getResueltaEn() { return resueltaEn; }
	public void setResueltaEn(Instant resueltaEn) { this.resueltaEn = resueltaEn; }

}
