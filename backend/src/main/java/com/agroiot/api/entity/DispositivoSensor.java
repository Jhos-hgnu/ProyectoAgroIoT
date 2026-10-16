package com.agroiot.api.entity;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

/** Sensores que un dispositivo ha enviado alguna vez. La llena la API con un upsert. */
@Entity
@Table(name = "dispositivo_sensor")
public class DispositivoSensor {

	@EmbeddedId
	private DispositivoSensorId id;

	@MapsId("dispositivoId")
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "dispositivo_id")
	private Dispositivo dispositivo;

	@MapsId("tipoSensor")
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "tipo_sensor")
	private TipoSensor tipo;

	@Column(name = "primera_lectura", nullable = false)
	private Instant primeraLectura;

	@Column(name = "ultima_lectura", nullable = false)
	private Instant ultimaLectura;

	@Column(name = "ultimo_valor", precision = 8, scale = 2)
	private BigDecimal ultimoValor;

	protected DispositivoSensor() {
	}

	public DispositivoSensorId getId() { return id; }
	public Dispositivo getDispositivo() { return dispositivo; }
	public TipoSensor getTipo() { return tipo; }
	public Instant getPrimeraLectura() { return primeraLectura; }
	public Instant getUltimaLectura() { return ultimaLectura; }
	public BigDecimal getUltimoValor() { return ultimoValor; }

}
