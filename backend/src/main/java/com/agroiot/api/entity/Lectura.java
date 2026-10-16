package com.agroiot.api.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

/** Un envío del ESP32 (o del simulador). Contiene de 1 a N mediciones. */
@Entity
@Table(name = "lectura")
public class Lectura {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "dispositivo_id", nullable = false)
	private Dispositivo dispositivo;

	@Column(name = "medida_en", nullable = false)
	private Instant medidaEn;

	@Column(name = "recibida_en", nullable = false)
	private Instant recibidaEn;

	@OneToMany(mappedBy = "lectura", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Medicion> mediciones = new ArrayList<>();

	protected Lectura() {
	}

	public Lectura(Dispositivo dispositivo, Instant medidaEn, Instant recibidaEn) {
		this.dispositivo = dispositivo;
		this.medidaEn = medidaEn;
		this.recibidaEn = recibidaEn;
	}

	public void agregarMedicion(TipoSensor tipo, BigDecimal valor) {
		mediciones.add(new Medicion(this, tipo, valor));
	}

	public Long getId() { return id; }
	public Dispositivo getDispositivo() { return dispositivo; }
	public Instant getMedidaEn() { return medidaEn; }
	public Instant getRecibidaEn() { return recibidaEn; }
	public List<Medicion> getMediciones() { return mediciones; }

}
