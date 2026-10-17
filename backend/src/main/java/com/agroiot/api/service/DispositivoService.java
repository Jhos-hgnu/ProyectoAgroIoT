package com.agroiot.api.service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroiot.api.dto.DispositivoPatchRequest;
import com.agroiot.api.dto.DispositivoResponse;
import com.agroiot.api.dto.EstadoSensor;
import com.agroiot.api.dto.SensorDetectado;
import com.agroiot.api.entity.Dispositivo;
import com.agroiot.api.entity.DispositivoSensor;
import com.agroiot.api.exception.ApiException;
import com.agroiot.api.repository.DispositivoRepository;
import com.agroiot.api.repository.DispositivoSensorRepository;

@Service
public class DispositivoService {

	/** Un sensor está ACTIVO si su última lectura tiene menos de 2 min. */
	private static final Duration SENSOR_ACTIVO = Duration.ofMinutes(2);
	/** El dispositivo está conectado si su última conexión tiene menos de 60 s. */
	private static final Duration CONECTADO = Duration.ofSeconds(60);
	private static final String HUMEDAD_SUELO = "HUMEDAD_SUELO";

	private final DispositivoRepository dispositivos;
	private final DispositivoSensorRepository dispositivoSensores;

	public DispositivoService(DispositivoRepository dispositivos, DispositivoSensorRepository dispositivoSensores) {
		this.dispositivos = dispositivos;
		this.dispositivoSensores = dispositivoSensores;
	}

	@Transactional(readOnly = true)
	public DispositivoResponse obtener(String id) {
		Dispositivo d = dispositivos.findById(id).orElseThrow(() -> ApiException.dispositivoNoEncontrado(id));
		Instant ahora = Instant.now();

		List<SensorDetectado> sensores = dispositivoSensores.findConTipoByDispositivoId(id).stream()
				.map(ds -> aSensor(ds, ahora))
				.toList();
		boolean sueloActivo = sensores.stream()
				.anyMatch(s -> HUMEDAD_SUELO.equals(s.tipo()) && s.estado() == EstadoSensor.ACTIVO);
		boolean conectado = d.getUltimaConexion() != null
				&& d.getUltimaConexion().isAfter(ahora.minus(CONECTADO));

		return new DispositivoResponse(d.getId(), d.getNombre(), d.getUbicacion(), d.isTieneBomba(),
				d.isRiegoAutomatico(), d.isTieneBomba() && sueloActivo, d.getUmbralRiego(),
				d.getDuracionRiegoSeg(), d.getEsperaRiegoMin(), d.getUltimaConexion(), conectado, sensores);
	}

	/** PATCH /dispositivos/{id}: cambia solo los campos que llegan (los null no se tocan). */
	@Transactional
	public DispositivoResponse actualizar(String id, DispositivoPatchRequest cambios) {
		if (cambios == null || (cambios.riegoAutomatico() == null && cambios.umbralRiego() == null
				&& cambios.duracionRiegoSeg() == null && cambios.esperaRiegoMin() == null
				&& cambios.tieneBomba() == null)) {
			throw ApiException.validacion("Envía al menos un campo: riegoAutomatico, umbralRiego, "
					+ "duracionRiegoSeg, esperaRiegoMin o tieneBomba");
		}
		Dispositivo d = dispositivos.findById(id).orElseThrow(() -> ApiException.dispositivoNoEncontrado(id));

		if (cambios.riegoAutomatico() != null) d.setRiegoAutomatico(cambios.riegoAutomatico());
		if (cambios.umbralRiego() != null) d.setUmbralRiego(cambios.umbralRiego().setScale(2)); // como NUMERIC(5,2)
		if (cambios.duracionRiegoSeg() != null) d.setDuracionRiegoSeg(cambios.duracionRiegoSeg());
		if (cambios.esperaRiegoMin() != null) d.setEsperaRiegoMin(cambios.esperaRiegoMin());
		if (cambios.tieneBomba() != null) d.setTieneBomba(cambios.tieneBomba());
		// TODO (fase 5): publicar riegoAutomatico, umbralRiego y tieneBomba en Firebase.

		dispositivos.flush();
		return obtener(id);
	}

	private static SensorDetectado aSensor(DispositivoSensor ds, Instant ahora) {
		EstadoSensor estado = ds.getUltimaLectura().isAfter(ahora.minus(SENSOR_ACTIVO))
				? EstadoSensor.ACTIVO
				: EstadoSensor.SIN_DATOS;
		return new SensorDetectado(ds.getTipo().getCodigo(), ds.getTipo().getNombre(), ds.getTipo().getUnidad(),
				ds.getUltimoValor(), ds.getUltimaLectura(), estado);
	}

}
