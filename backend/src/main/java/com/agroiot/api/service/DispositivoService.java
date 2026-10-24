package com.agroiot.api.service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroiot.api.dto.DispositivoCrearRequest;
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
	private static final Pattern ID_CORRELATIVO = Pattern.compile("maceta-(\\d+)");

	private final DispositivoRepository dispositivos;
	private final DispositivoSensorRepository dispositivoSensores;
	private final EstadoVivoService estadoVivo;

	public DispositivoService(DispositivoRepository dispositivos, DispositivoSensorRepository dispositivoSensores,
			EstadoVivoService estadoVivo) {
		this.dispositivos = dispositivos;
		this.dispositivoSensores = dispositivoSensores;
		this.estadoVivo = estadoVivo;
	}

	@Transactional(readOnly = true)
	public DispositivoResponse obtener(String id) {
		Dispositivo d = dispositivos.findById(id).orElseThrow(() -> ApiException.dispositivoNoEncontrado(id));
		return aRespuesta(d, Instant.now());
	}

	/** GET /dispositivos: todas las macetas registradas, por id. */
	@Transactional(readOnly = true)
	public List<DispositivoResponse> listar() {
		Instant ahora = Instant.now();
		return dispositivos.findAllByOrderByIdAsc().stream().map(d -> aRespuesta(d, ahora)).toList();
	}

	/**
	 * POST /dispositivos: registra una maceta nueva. El id es el siguiente correlativo (maceta-02, maceta-03...).
	 * Nace sin sensores: aparecen solos cuando el ESP32 (o el simulador) envía su primera lectura con ese id.
	 */
	@Transactional
	public DispositivoResponse crear(DispositivoCrearRequest req) {
		String id = String.format("maceta-%02d", siguienteNumero());
		String cultivo = req.cultivo().trim();
		String zona = textoOpcional(req.zona());
		String sector = textoOpcional(req.sector());

		Dispositivo d = new Dispositivo(id, String.format("Maceta %02d — %s", Integer.parseInt(id.substring(7)), cultivo));
		d.setCultivo(cultivo);
		d.setZona(zona);
		d.setSector(sector);
		d.setUbicacion(zona == null ? sector : sector == null ? zona : zona + " · " + sector);
		d.setTieneBomba(req.tieneBomba() == null || req.tieneBomba());
		try {
			dispositivos.saveAndFlush(d);
		} catch (DataIntegrityViolationException e) {
			// Dos altas a la vez calcularon el mismo correlativo.
			throw ApiException.dispositivoDuplicado(id);
		}
		estadoVivo.publicarConfiguracion(d);
		return aRespuesta(d, Instant.now());
	}

	private int siguienteNumero() {
		int maximo = 0;
		for (String existente : dispositivos.findAllIds()) {
			Matcher m = ID_CORRELATIVO.matcher(existente);
			if (m.matches()) maximo = Math.max(maximo, Integer.parseInt(m.group(1)));
		}
		return maximo + 1;
	}

	private static String textoOpcional(String texto) {
		return texto == null || texto.isBlank() ? null : texto.trim();
	}

	private DispositivoResponse aRespuesta(Dispositivo d, Instant ahora) {
		String id = d.getId();
		List<SensorDetectado> sensores = dispositivoSensores.findConTipoByDispositivoId(id).stream()
				.map(ds -> aSensor(ds, ahora))
				.toList();
		boolean sueloActivo = sensores.stream()
				.anyMatch(s -> HUMEDAD_SUELO.equals(s.tipo()) && s.estado() == EstadoSensor.ACTIVO);
		boolean conectado = d.getUltimaConexion() != null
				&& d.getUltimaConexion().isAfter(ahora.minus(CONECTADO));

		return new DispositivoResponse(d.getId(), d.getNombre(), d.getUbicacion(), d.getCultivo(), d.getZona(),
				d.getSector(), d.isTieneBomba(),
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
		estadoVivo.publicarConfiguracion(d);

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
