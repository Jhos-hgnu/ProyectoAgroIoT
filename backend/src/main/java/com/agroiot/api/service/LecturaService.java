package com.agroiot.api.service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroiot.api.dto.ComandoEntregado;
import com.agroiot.api.dto.LecturaRequest;
import com.agroiot.api.dto.LecturaResponse;
import com.agroiot.api.dto.MedicionDescartada;
import com.agroiot.api.dto.MedicionRequest;
import com.agroiot.api.dto.MotivoDescarte;
import com.agroiot.api.entity.Dispositivo;
import com.agroiot.api.entity.EstadoComando;
import com.agroiot.api.entity.Lectura;
import com.agroiot.api.entity.Medicion;
import com.agroiot.api.entity.TipoSensor;
import com.agroiot.api.exception.ApiException;
import com.agroiot.api.repository.ComandoRiegoRepository;
import com.agroiot.api.repository.DispositivoRepository;
import com.agroiot.api.repository.DispositivoSensorRepository;
import com.agroiot.api.repository.LecturaRepository;
import com.agroiot.api.repository.TipoSensorRepository;

/** Reglas de negocio de POST /lecturas (ver "Al recibir POST /lecturas" en el contrato). */
@Service
public class LecturaService {

	private static final String HUMEDAD_SUELO = "HUMEDAD_SUELO";
	private static final Duration ANTIGUEDAD_MAXIMA = Duration.ofDays(7);
	/** Una lectura es "en tiempo real" si se midió hace menos de 2 min; si no, es historial. */
	private static final Duration TIEMPO_REAL = Duration.ofMinutes(2);

	private final DispositivoRepository dispositivos;
	private final TipoSensorRepository tiposSensor;
	private final LecturaRepository lecturas;
	private final DispositivoSensorRepository dispositivoSensores;
	private final ComandoRiegoRepository comandos;
	private final RiegoService riegos;

	public LecturaService(DispositivoRepository dispositivos, TipoSensorRepository tiposSensor,
			LecturaRepository lecturas, DispositivoSensorRepository dispositivoSensores,
			ComandoRiegoRepository comandos, RiegoService riegos) {
		this.dispositivos = dispositivos;
		this.tiposSensor = tiposSensor;
		this.lecturas = lecturas;
		this.dispositivoSensores = dispositivoSensores;
		this.comandos = comandos;
		this.riegos = riegos;
	}

	@Transactional
	public LecturaResponse registrar(LecturaRequest req) {
		Instant ahora = Instant.now();
		Instant medidaEn = req.medidaEn() != null ? req.medidaEn() : ahora;
		if (medidaEn.isAfter(ahora)) {
			throw ApiException.validacion("medidaEn no puede estar en el futuro");
		}
		if (medidaEn.isBefore(ahora.minus(ANTIGUEDAD_MAXIMA))) {
			throw ApiException.validacion("medidaEn no puede tener más de 7 días");
		}

		// 1. La X-Api-Key ya la validó ApiKeyFilter; aquí, que el dispositivo exista.
		Dispositivo dispositivo = dispositivos.findById(req.dispositivoId())
				.orElseThrow(() -> ApiException.dispositivoNoEncontrado(req.dispositivoId()));

		// 2. Validar cada medición por separado; las inválidas van a descartadas.
		Map<String, TipoSensor> catalogo = tiposSensor.findAll().stream()
				.collect(Collectors.toMap(TipoSensor::getCodigo, Function.identity()));
		Lectura lectura = new Lectura(dispositivo, medidaEn, ahora);
		List<MedicionDescartada> descartadas = new ArrayList<>();
		Set<String> vistos = new HashSet<>();
		for (MedicionRequest m : req.mediciones()) {
			TipoSensor tipo = catalogo.get(m.tipo());
			MotivoDescarte motivo = !vistos.add(m.tipo()) ? MotivoDescarte.DUPLICADO
					: tipo == null ? MotivoDescarte.TIPO_DESCONOCIDO
					: !tipo.enRango(m.valor()) ? MotivoDescarte.FUERA_DE_RANGO
					: null;
			if (motivo != null) {
				descartadas.add(new MedicionDescartada(m.tipo(), m.valor(), motivo));
			} else {
				lectura.agregarMedicion(tipo, m.valor());
			}
		}

		// 3. Sin mediciones válidas → 422.
		if (lectura.getMediciones().isEmpty()) {
			throw ApiException.sinMedicionesValidas(
					"Ninguna medición es válida (" + descartadas.size() + " descartadas)");
		}

		// 4. Guardar lectura + mediciones, upsert en dispositivo_sensor y actualizar ultima_conexion.
		lecturas.save(lectura);
		for (Medicion m : lectura.getMediciones()) {
			dispositivoSensores.upsert(dispositivo.getId(), m.getTipo().getCodigo(), medidaEn, m.getValor());
		}
		dispositivo.setUltimaConexion(ahora);

		// 5. Solo en tiempo real (medidaEn de hace menos de 2 min): riego automático.
		//    El historial se guarda pero no dispara riegos, alertas ni Firebase.
		if (!medidaEn.isBefore(ahora.minus(TIEMPO_REAL))) {
			BigDecimal humedadSuelo = lectura.getMediciones().stream()
					.filter(m -> HUMEDAD_SUELO.equals(m.getTipo().getCodigo()))
					.map(Medicion::getValor)
					.findFirst()
					.orElse(null);
			riegos.evaluarRiegoAutomatico(dispositivo, humedadSuelo);
			// TODO (fase 4): evaluar alertas. TODO (fase 5): actualizar Firebase.
		}

		// 6. Expirar comandos viejos y entregar el PENDIENTE (si hay) marcándolo ENVIADO.
		comandos.expirarAbiertos(dispositivo.getId());
		ComandoEntregado comando = comandos
				.findFirstByDispositivo_IdAndEstadoOrderByCreadoEnAsc(dispositivo.getId(), EstadoComando.PENDIENTE)
				.map(c -> {
					c.marcarEnviado(ahora);
					return new ComandoEntregado(c.getId(), ComandoEntregado.REGAR, c.getDuracionSeg());
				})
				.orElse(null);

		List<String> aceptadas = lectura.getMediciones().stream().map(m -> m.getTipo().getCodigo()).toList();
		return new LecturaResponse(lectura.getId(), aceptadas, descartadas, comando);
	}

}
