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

/** Comando de riego (manual o automático). También es el historial de riegos. */
@Entity
@Table(name = "comando_riego")
public class ComandoRiego {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "dispositivo_id", nullable = false)
	private Dispositivo dispositivo;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 12)
	private OrigenComando origen;

	@Column(name = "duracion_seg", nullable = false)
	private int duracionSeg;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 12)
	private EstadoComando estado = EstadoComando.PENDIENTE;

	@Column(name = "humedad_suelo_antes", precision = 5, scale = 2)
	private BigDecimal humedadSueloAntes;

	@Column(length = 200)
	private String detalle;

	@Column(name = "creado_en", nullable = false)
	private Instant creadoEn;

	@Column(name = "enviado_en")
	private Instant enviadoEn;

	@Column(name = "finalizado_en")
	private Instant finalizadoEn;

	protected ComandoRiego() {
	}

	public ComandoRiego(Dispositivo dispositivo, OrigenComando origen, int duracionSeg, BigDecimal humedadSueloAntes) {
		this.dispositivo = dispositivo;
		this.origen = origen;
		this.duracionSeg = duracionSeg;
		this.humedadSueloAntes = humedadSueloAntes;
	}

	@PrePersist
	void alCrear() {
		if (creadoEn == null) {
			creadoEn = Instant.now();
		}
	}

	/** PENDIENTE → ENVIADO: el comando viaja en la respuesta de una lectura. */
	public void marcarEnviado(Instant ahora) {
		this.estado = EstadoComando.ENVIADO;
		this.enviadoEn = ahora;
	}

	/** ENVIADO → EJECUTADO o FALLIDO: lo confirma el ESP32. */
	public void finalizar(EstadoComando estadoFinal, String detalle, Instant ahora) {
		this.estado = estadoFinal;
		this.detalle = detalle;
		this.finalizadoEn = ahora;
	}

	public Long getId() { return id; }
	public Dispositivo getDispositivo() { return dispositivo; }
	public OrigenComando getOrigen() { return origen; }
	public int getDuracionSeg() { return duracionSeg; }
	public EstadoComando getEstado() { return estado; }
	public void setEstado(EstadoComando estado) { this.estado = estado; }
	public BigDecimal getHumedadSueloAntes() { return humedadSueloAntes; }
	public String getDetalle() { return detalle; }
	public void setDetalle(String detalle) { this.detalle = detalle; }
	public Instant getCreadoEn() { return creadoEn; }
	public Instant getEnviadoEn() { return enviadoEn; }
	public Instant getFinalizadoEn() { return finalizadoEn; }
	public void setFinalizadoEn(Instant finalizadoEn) { this.finalizadoEn = finalizadoEn; }

}
