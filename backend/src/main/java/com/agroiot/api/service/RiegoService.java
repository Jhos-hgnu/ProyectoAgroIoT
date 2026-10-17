package com.agroiot.api.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroiot.api.dto.ConfirmacionRequest;
import com.agroiot.api.dto.ConfirmacionResponse;
import com.agroiot.api.dto.RiegoResponse;
import com.agroiot.api.entity.ComandoRiego;
import com.agroiot.api.entity.Dispositivo;
import com.agroiot.api.entity.DispositivoSensorId;
import com.agroiot.api.entity.EstadoComando;
import com.agroiot.api.entity.OrigenComando;
import com.agroiot.api.entity.Severidad;
import com.agroiot.api.exception.ApiException;
import com.agroiot.api.repository.ComandoRiegoRepository;
import com.agroiot.api.repository.DispositivoRepository;
import com.agroiot.api.repository.DispositivoSensorRepository;

/**
 * Riegos manuales y automáticos y su ciclo (ver "Ciclo de un comando" en el contrato):
 * PENDIENTE → ENVIADO (viaja en la respuesta de una lectura) → EJECUTADO o FALLIDO (confirma el ESP32).
 * Sin confirmación en 2 min → EXPIRADO; se revisa antes de crear, entregar o confirmar un comando.
 */
@Service
public class RiegoService {

	private static final Logger log = LoggerFactory.getLogger(RiegoService.class);

	private static final String HUMEDAD_SUELO = "HUMEDAD_SUELO";
	private static final List<EstadoComando> ABIERTOS = List.of(EstadoComando.PENDIENTE, EstadoComando.ENVIADO);

	private final DispositivoRepository dispositivos;
	private final DispositivoSensorRepository dispositivoSensores;
	private final ComandoRiegoRepository comandos;
	private final AlertaService alertas;

	public RiegoService(DispositivoRepository dispositivos, DispositivoSensorRepository dispositivoSensores,
			ComandoRiegoRepository comandos, AlertaService alertas) {
		this.dispositivos = dispositivos;
		this.dispositivoSensores = dispositivoSensores;
		this.comandos = comandos;
		this.alertas = alertas;
	}

	/** POST /dispositivos/{id}/riegos: riego manual. duracionSeg null = la configurada. */
	@Transactional
	public RiegoResponse regarAhora(String dispositivoId, Integer duracionSeg) {
		Dispositivo d = dispositivos.findById(dispositivoId)
				.orElseThrow(() -> ApiException.dispositivoNoEncontrado(dispositivoId));
		if (!d.isTieneBomba()) {
			throw ApiException.bombaNoDisponible(dispositivoId);
		}
		comandos.expirarAbiertos(dispositivoId);
		if (comandos.existsByDispositivo_IdAndEstadoIn(dispositivoId, ABIERTOS)) {
			throw ApiException.riegoEnCurso(dispositivoId);
		}

		// En el manual, humedad_suelo_antes es el último valor conocido del suelo (o null si no hay sensor).
		BigDecimal humedadAntes = dispositivoSensores.findById(new DispositivoSensorId(dispositivoId, HUMEDAD_SUELO))
				.map(ds -> ds.getUltimoValor())
				.orElse(null);
		int duracion = duracionSeg != null ? duracionSeg : d.getDuracionRiegoSeg();
		ComandoRiego c = new ComandoRiego(d, OrigenComando.MANUAL, duracion, humedadAntes);
		try {
			// El índice único uq_comando_abierto cubre la carrera entre la verificación y el INSERT.
			comandos.saveAndFlush(c);
		} catch (DataIntegrityViolationException e) {
			throw ApiException.riegoEnCurso(dispositivoId);
		}
		// TODO (fase 5): publicar el nodo riego en Firebase.
		return aRespuesta(c);
	}

	/**
	 * Paso 5 de POST /lecturas (solo lecturas en tiempo real): crea un riego AUTOMATICO si el riego automático
	 * está activo, hay bomba, el suelo está bajo el umbral y la consulta 7 lo permite. El comando queda
	 * PENDIENTE y el paso 6 lo entrega en la respuesta de esta misma lectura.
	 */
	@Transactional
	public void evaluarRiegoAutomatico(Dispositivo d, BigDecimal humedadSuelo) {
		if (humedadSuelo == null || !d.isRiegoAutomatico() || !d.isTieneBomba()
				|| humedadSuelo.compareTo(d.getUmbralRiego()) >= 0) {
			return;
		}
		comandos.expirarAbiertos(d.getId());
		if (!comandos.puedeRegarAutomaticamente(d.getId())) {
			return;
		}
		ComandoRiego c = comandos.save(
				new ComandoRiego(d, OrigenComando.AUTOMATICO, d.getDuracionRiegoSeg(), humedadSuelo));
		log.info("Riego automático #{} para {}: suelo {} % < umbral {} %", c.getId(), d.getId(), humedadSuelo,
				d.getUmbralRiego());
		// TODO (fase 5): publicar el nodo riego en Firebase.
	}

	/** GET /dispositivos/{id}/riegos, del más reciente al más antiguo. */
	@Transactional(readOnly = true)
	public List<RiegoResponse> historial(String dispositivoId, int limite) {
		if (!dispositivos.existsById(dispositivoId)) {
			throw ApiException.dispositivoNoEncontrado(dispositivoId);
		}
		return comandos.findByDispositivo_IdOrderByCreadoEnDescIdDesc(dispositivoId, Limit.of(limite)).stream()
				.map(RiegoService::aRespuesta)
				.toList();
	}

	/**
	 * POST /comandos/{id}/confirmacion: el ESP32 avisa si el riego se ejecutó o falló.
	 * noRollbackFor: si el comando acaba de expirar, el 409 no debe deshacer el paso a EXPIRADO.
	 */
	@Transactional(noRollbackFor = ApiException.class)
	public ConfirmacionResponse confirmar(Long comandoId, ConfirmacionRequest req) {
		ComandoRiego c = comandos.findById(comandoId)
				.filter(x -> x.getDispositivo().getId().equals(req.dispositivoId()))
				.orElseThrow(() -> ApiException.comandoNoEncontrado(comandoId));

		// Una confirmación que llega después de 2 min ya no cuenta: el comando expiró.
		// expirarAbiertos limpia el contexto de JPA, así que el comando se vuelve a leer para poder modificarlo.
		comandos.expirarAbiertos(req.dispositivoId());
		c = comandos.findById(comandoId).orElseThrow();
		if (c.getEstado() != EstadoComando.ENVIADO) {
			throw ApiException.comandoNoEnviado(comandoId, c.getEstado().name());
		}

		EstadoComando estado = EstadoComando.valueOf(req.estado());
		Instant ahora = Instant.now();
		c.finalizar(estado, req.detalle(), ahora);
		if (estado == EstadoComando.FALLIDO) {
			alertas.abrirDelSistema(c.getDispositivo(), Severidad.CRITICA,
					"La bomba no se activó (riego #" + c.getId() + ")");
			log.warn("Riego #{} FALLIDO: {}", c.getId(), req.detalle());
		}
		// TODO (fase 5): publicar el nodo riego en Firebase.
		return new ConfirmacionResponse(c.getId(), c.getEstado());
	}

	private static RiegoResponse aRespuesta(ComandoRiego c) {
		return new RiegoResponse(c.getId(), c.getOrigen(), c.getEstado(), c.getDuracionSeg(),
				c.getHumedadSueloAntes(), c.getCreadoEn(), c.getFinalizadoEn());
	}

}
