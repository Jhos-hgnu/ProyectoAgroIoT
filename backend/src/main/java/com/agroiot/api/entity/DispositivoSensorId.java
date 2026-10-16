package com.agroiot.api.entity;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** Llave compuesta de dispositivo_sensor: (dispositivo_id, tipo_sensor). */
@Embeddable
public class DispositivoSensorId implements Serializable {

	@Column(name = "dispositivo_id", length = 40)
	private String dispositivoId;

	@Column(name = "tipo_sensor", length = 30)
	private String tipoSensor;

	protected DispositivoSensorId() {
	}

	public DispositivoSensorId(String dispositivoId, String tipoSensor) {
		this.dispositivoId = dispositivoId;
		this.tipoSensor = tipoSensor;
	}

	public String getDispositivoId() { return dispositivoId; }
	public String getTipoSensor() { return tipoSensor; }

	@Override
	public boolean equals(Object o) {
		return o instanceof DispositivoSensorId otro
				&& Objects.equals(dispositivoId, otro.dispositivoId)
				&& Objects.equals(tipoSensor, otro.tipoSensor);
	}

	@Override
	public int hashCode() {
		return Objects.hash(dispositivoId, tipoSensor);
	}

}
