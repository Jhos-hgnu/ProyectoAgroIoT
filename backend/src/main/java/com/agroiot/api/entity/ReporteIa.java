package com.agroiot.api.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/** Reporte generado por la IA. */
@Entity
@Table(name = "reporte_ia")
public class ReporteIa {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "dispositivo_id", nullable = false)
	private Dispositivo dispositivo;

	@Column(nullable = false)
	private Instant desde;

	@Column(nullable = false)
	private Instant hasta;

	/** Tipos con datos, separados por coma. */
	@Column(nullable = false, length = 200)
	private String sensores;

	/** JSON que se envió al modelo (TEXT). */
	@Column(name = "resumen_entrada", nullable = false)
	private String resumenEntrada;

	/** Respuesta del modelo en Markdown (TEXT). */
	@Column(nullable = false)
	private String contenido;

	@Column(nullable = false, length = 60)
	private String modelo;

	@Column(name = "creado_en", nullable = false)
	private Instant creadoEn;

	protected ReporteIa() {
	}

	public ReporteIa(Dispositivo dispositivo, Instant desde, Instant hasta, String sensores,
			String resumenEntrada, String contenido, String modelo) {
		this.dispositivo = dispositivo;
		this.desde = desde;
		this.hasta = hasta;
		this.sensores = sensores;
		this.resumenEntrada = resumenEntrada;
		this.contenido = contenido;
		this.modelo = modelo;
	}

	@PrePersist
	void alCrear() {
		if (creadoEn == null) {
			creadoEn = Instant.now();
		}
	}

	public Long getId() { return id; }
	public Dispositivo getDispositivo() { return dispositivo; }
	public Instant getDesde() { return desde; }
	public Instant getHasta() { return hasta; }
	public String getSensores() { return sensores; }
	public String getResumenEntrada() { return resumenEntrada; }
	public String getContenido() { return contenido; }
	public String getModelo() { return modelo; }
	public Instant getCreadoEn() { return creadoEn; }

}
