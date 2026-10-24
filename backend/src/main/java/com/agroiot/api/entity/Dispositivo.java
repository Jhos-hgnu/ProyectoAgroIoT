package com.agroiot.api.entity;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/** La maceta y su configuración de riego. */
@Entity
@Table(name = "dispositivo")
public class Dispositivo {

	@Id
	@Column(length = 40)
	private String id;

	@Column(nullable = false, length = 80)
	private String nombre;

	@Column(length = 120)
	private String ubicacion;

	@Column(length = 80)
	private String cultivo;

	@Column(length = 40)
	private String zona;

	@Column(length = 40)
	private String sector;

	@Column(name = "tiene_bomba", nullable = false)
	private boolean tieneBomba;

	@Column(name = "riego_automatico", nullable = false)
	private boolean riegoAutomatico = true;

	@Column(name = "umbral_riego", nullable = false, precision = 5, scale = 2)
	private BigDecimal umbralRiego = BigDecimal.valueOf(35);

	@Column(name = "duracion_riego_seg", nullable = false)
	private int duracionRiegoSeg = 5;

	@Column(name = "espera_riego_min", nullable = false)
	private int esperaRiegoMin = 10;

	@Column(name = "ultima_conexion")
	private Instant ultimaConexion;

	@Column(name = "creado_en", nullable = false)
	private Instant creadoEn;

	public Dispositivo(String id, String nombre) {
		this.id = id;
		this.nombre = nombre;
	}

	protected Dispositivo() {
	}

	@PrePersist
	void alCrear() {
		if (creadoEn == null) {
			creadoEn = Instant.now();
		}
	}

	public String getId() { return id; }
	public String getNombre() { return nombre; }
	public void setNombre(String nombre) { this.nombre = nombre; }
	public String getUbicacion() { return ubicacion; }
	public void setUbicacion(String ubicacion) { this.ubicacion = ubicacion; }
	public String getCultivo() { return cultivo; }
	public void setCultivo(String cultivo) { this.cultivo = cultivo; }
	public String getZona() { return zona; }
	public void setZona(String zona) { this.zona = zona; }
	public String getSector() { return sector; }
	public void setSector(String sector) { this.sector = sector; }
	public boolean isTieneBomba() { return tieneBomba; }
	public void setTieneBomba(boolean tieneBomba) { this.tieneBomba = tieneBomba; }
	public boolean isRiegoAutomatico() { return riegoAutomatico; }
	public void setRiegoAutomatico(boolean riegoAutomatico) { this.riegoAutomatico = riegoAutomatico; }
	public BigDecimal getUmbralRiego() { return umbralRiego; }
	public void setUmbralRiego(BigDecimal umbralRiego) { this.umbralRiego = umbralRiego; }
	public int getDuracionRiegoSeg() { return duracionRiegoSeg; }
	public void setDuracionRiegoSeg(int duracionRiegoSeg) { this.duracionRiegoSeg = duracionRiegoSeg; }
	public int getEsperaRiegoMin() { return esperaRiegoMin; }
	public void setEsperaRiegoMin(int esperaRiegoMin) { this.esperaRiegoMin = esperaRiegoMin; }
	public Instant getUltimaConexion() { return ultimaConexion; }
	public void setUltimaConexion(Instant ultimaConexion) { this.ultimaConexion = ultimaConexion; }
	public Instant getCreadoEn() { return creadoEn; }

}
