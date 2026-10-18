package com.agroiot.api.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroiot.api.dto.AlertaResponse;
import com.agroiot.api.entity.Alerta;
import com.agroiot.api.entity.Dispositivo;
import com.agroiot.api.entity.ReglaAlerta;
import com.agroiot.api.entity.Severidad;
import com.agroiot.api.exception.ApiException;
import com.agroiot.api.repository.AlertaRepository;
import com.agroiot.api.repository.DispositivoRepository;
import com.agroiot.api.repository.ReglaAlertaRepository;

/** Alertas por umbral (tabla regla_alerta) y alertas del sistema (riego fallido). */
@Service
public class AlertaService {

	private static final Logger log = LoggerFactory.getLogger(AlertaService.class);

	private final DispositivoRepository dispositivos;
	private final ReglaAlertaRepository reglas;
	private final AlertaRepository alertas;
	private final EstadoVivoService estadoVivo;

	public AlertaService(DispositivoRepository dispositivos, ReglaAlertaRepository reglas, AlertaRepository alertas,
			EstadoVivoService estadoVivo) {
		this.dispositivos = dispositivos;
		this.reglas = reglas;
		this.alertas = alertas;
		this.estadoVivo = estadoVivo;
	}

	/**
	 * Paso 5 de POST /lecturas (solo en tiempo real). Por cada regla activa de un tipo que vino en la lectura:
	 * si se cumple y no hay alerta abierta, se abre; si ya no se cumple y hay una abierta, se cierra sola.
	 * Los sensores que no vinieron no abren ni cierran nada.
	 *
	 * @param valores tipo de sensor → valor aceptado en esta lectura
	 */
	@Transactional
	public void evaluar(Dispositivo d, Map<String, BigDecimal> valores) {
		if (valores.isEmpty()) {
			return;
		}
		Map<Integer, Alerta> abiertas = alertas.findByDispositivo_IdAndResueltaEnIsNull(d.getId()).stream()
				.filter(a -> a.getRegla() != null)
				.collect(Collectors.toMap(a -> a.getRegla().getId(), Function.identity()));
		Instant ahora = Instant.now();

		for (ReglaAlerta r : reglas.findActivasDeTipos(valores.keySet())) {
			BigDecimal valor = valores.get(r.getTipo().getCodigo());
			Alerta abierta = abiertas.get(r.getId());
			if (seCumple(r, valor)) {
				if (abierta == null) {
					estadoVivo.publicarAlertaAbierta(
							alertas.save(new Alerta(d, r, r.getTipo(), valor, r.getSeveridad(), r.getMensaje())));
					log.info("Alerta abierta en {}: {} ({} {} {})", d.getId(), r.getMensaje(), valor,
							r.getOperador(), r.getUmbral());
				}
			} else if (abierta != null) {
				abierta.setResueltaEn(ahora);
				estadoVivo.quitarAlerta(abierta);
				log.info("Alerta #{} cerrada sola en {}: {} = {}", abierta.getId(), d.getId(),
						r.getTipo().getCodigo(), valor);
			}
		}
	}

	/** Alerta del sistema (sin regla ni sensor), p. ej. riego fallido. No se cierra sola: se resuelve a mano. */
	@Transactional
	public void abrirDelSistema(Dispositivo d, Severidad severidad, String mensaje) {
		estadoVivo.publicarAlertaAbierta(alertas.save(new Alerta(d, null, null, null, severidad, mensaje)));
		log.warn("Alerta del sistema en {}: {}", d.getId(), mensaje);
	}

	/** GET /dispositivos/{id}/alertas?estado=ACTIVA|TODAS, más reciente primero. */
	@Transactional(readOnly = true)
	public List<AlertaResponse> listar(String dispositivoId, String estado, int limite) {
		boolean todas = switch (estado.trim().toUpperCase()) {
			case "ACTIVA" -> false;
			case "TODAS" -> true;
			default -> throw ApiException.validacion("estado debe ser ACTIVA o TODAS");
		};
		if (!dispositivos.existsById(dispositivoId)) {
			throw ApiException.dispositivoNoEncontrado(dispositivoId);
		}
		List<Alerta> lista = todas
				? alertas.findByDispositivo_IdOrderByCreadaEnDescIdDesc(dispositivoId, Limit.of(limite))
				: alertas.findByDispositivo_IdAndResueltaEnIsNullOrderByCreadaEnDescIdDesc(dispositivoId,
						Limit.of(limite));
		return lista.stream().map(AlertaService::aRespuesta).toList();
	}

	/** POST /alertas/{id}/resolver. Si ya estaba resuelta, la devuelve tal cual (se puede repetir sin efecto). */
	@Transactional
	public AlertaResponse resolver(Long alertaId) {
		Alerta a = alertas.findById(alertaId).orElseThrow(() -> ApiException.alertaNoEncontrada(alertaId));
		if (a.getResueltaEn() == null) {
			a.setResueltaEn(Instant.now());
			estadoVivo.quitarAlerta(a);
		}
		return aRespuesta(a);
	}

	private static boolean seCumple(ReglaAlerta r, BigDecimal valor) {
		int comparacion = valor.compareTo(r.getUmbral());
		return switch (r.getOperador()) {
			case "<" -> comparacion < 0;
			case ">" -> comparacion > 0;
			default -> false; // el CHECK de la tabla solo permite < y >
		};
	}

	private static AlertaResponse aRespuesta(Alerta a) {
		return new AlertaResponse(a.getId(), a.getTipo() == null ? null : a.getTipo().getCodigo(),
				a.getSeveridad(), a.getMensaje(), a.getValor(), a.getCreadaEn(), a.getResueltaEn());
	}

}
