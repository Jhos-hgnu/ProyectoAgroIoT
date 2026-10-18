package com.agroiot.api.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agroiot.api.entity.Alerta;
import com.agroiot.api.entity.ComandoRiego;
import com.agroiot.api.entity.Dispositivo;
import com.agroiot.api.entity.DispositivoSensor;
import com.agroiot.api.entity.Medicion;
import com.agroiot.api.firebase.FirebaseCliente;
import com.agroiot.api.repository.AlertaRepository;
import com.agroiot.api.repository.ComandoRiegoRepository;
import com.agroiot.api.repository.DispositivoRepository;
import com.agroiot.api.repository.DispositivoSensorRepository;

/**
 * Publica en Firebase el estado en vivo de cada dispositivo: dispositivos/{id} (ver "Firebase Realtime Database"
 * en el contrato). Solo el último estado; el historial vive en PostgreSQL. Las fechas van en milisegundos.
 * Los métodos arman los datos al llamarlos y FirebaseCliente los escribe después del commit.
 */
@Service
public class EstadoVivoService {

	private static final Logger log = LoggerFactory.getLogger(EstadoVivoService.class);

	private final FirebaseCliente firebase;
	private final DispositivoRepository dispositivos;
	private final DispositivoSensorRepository dispositivoSensores;
	private final ComandoRiegoRepository comandos;
	private final AlertaRepository alertas;

	public EstadoVivoService(FirebaseCliente firebase, DispositivoRepository dispositivos,
			DispositivoSensorRepository dispositivoSensores, ComandoRiegoRepository comandos,
			AlertaRepository alertas) {
		this.firebase = firebase;
		this.dispositivos = dispositivos;
		this.dispositivoSensores = dispositivoSensores;
		this.comandos = comandos;
		this.alertas = alertas;
	}

	/**
	 * Al arrancar la API: reescribe el nodo completo de cada dispositivo desde PostgreSQL. Así Firebase queda
	 * igual a la BD aunque haya estado caído o vacío (p. ej. el emulador recién iniciado).
	 */
	@EventListener(ApplicationReadyEvent.class)
	@Transactional(readOnly = true)
	public void sincronizarTodo() {
		if (!firebase.configurado()) {
			return;
		}
		List<Dispositivo> todos = dispositivos.findAll();
		for (Dispositivo d : todos) {
			Map<String, Object> nodo = new HashMap<>(configuracion(d));
			nodo.put("ultimaConexion", ms(d.getUltimaConexion()));

			Map<String, Object> sensores = new HashMap<>();
			for (DispositivoSensor ds : dispositivoSensores.findConTipoByDispositivoId(d.getId())) {
				sensores.put(ds.getTipo().getCodigo(),
						sensor(ds.getUltimoValor(), ds.getTipo().getUnidad(), ds.getUltimaLectura()));
			}
			nodo.put("sensores", sensores);

			comandos.findFirstByDispositivo_IdOrderByCreadoEnDescIdDesc(d.getId())
					.ifPresent(c -> nodo.put("riego", riego(c)));

			Map<String, Object> activas = new HashMap<>();
			for (Alerta a : alertas.findByDispositivo_IdAndResueltaEnIsNull(d.getId())) {
				activas.put(a.getId().toString(), alerta(a));
			}
			nodo.put("alertasActivas", activas);

			firebase.reemplazar(ruta(d.getId()), nodo);
		}
		log.info("Firebase: estado en vivo sincronizado para {} dispositivo(s)", todos.size());
	}

	/** Arranque o PATCH /dispositivos/{id}: nombre, tieneBomba, riegoAutomatico y umbralRiego. */
	public void publicarConfiguracion(Dispositivo d) {
		firebase.actualizar(ruta(d.getId()), configuracion(d));
	}

	/** Lectura en tiempo real: ultimaConexion y un nodo sensores/<TIPO> por cada medición aceptada. */
	public void publicarLectura(Dispositivo d, Instant medidaEn, List<Medicion> mediciones) {
		Map<String, Object> cambios = new HashMap<>();
		cambios.put("ultimaConexion", ms(d.getUltimaConexion()));
		for (Medicion m : mediciones) {
			cambios.put("sensores/" + m.getTipo().getCodigo(), sensor(m.getValor(), m.getTipo().getUnidad(), medidaEn));
		}
		firebase.actualizar(ruta(d.getId()), cambios);
	}

	/** Un comando de riego se crea, se envía, se confirma o expira. */
	public void publicarRiego(ComandoRiego c) {
		firebase.reemplazar(ruta(c.getDispositivo().getId()) + "/riego", riego(c));
	}

	/** Tras expirar comandos con una consulta masiva: publica el último comando, que es el que expiró. */
	public void publicarUltimoRiego(String dispositivoId) {
		comandos.findFirstByDispositivo_IdOrderByCreadoEnDescIdDesc(dispositivoId).ifPresent(this::publicarRiego);
	}

	public void publicarAlertaAbierta(Alerta a) {
		firebase.reemplazar(ruta(a.getDispositivo().getId()) + "/alertasActivas/" + a.getId(), alerta(a));
	}

	/** La alerta se cerró sola o se resolvió a mano. */
	public void quitarAlerta(Alerta a) {
		firebase.reemplazar(ruta(a.getDispositivo().getId()) + "/alertasActivas/" + a.getId(), null);
	}

	private static String ruta(String dispositivoId) {
		return "dispositivos/" + dispositivoId;
	}

	private static Map<String, Object> configuracion(Dispositivo d) {
		Map<String, Object> m = new LinkedHashMap<>();
		m.put("nombre", d.getNombre());
		m.put("tieneBomba", d.isTieneBomba());
		m.put("riegoAutomatico", d.isRiegoAutomatico());
		m.put("umbralRiego", numero(d.getUmbralRiego()));
		return m;
	}

	private static Map<String, Object> sensor(BigDecimal valor, String unidad, Instant actualizadoEn) {
		Map<String, Object> m = new LinkedHashMap<>();
		m.put("valor", numero(valor));
		m.put("unidad", unidad);
		m.put("actualizadoEn", ms(actualizadoEn));
		return m;
	}

	private static Map<String, Object> riego(ComandoRiego c) {
		Instant actualizadoEn = c.getFinalizadoEn() != null ? c.getFinalizadoEn()
				: c.getEnviadoEn() != null ? c.getEnviadoEn()
				: c.getCreadoEn();
		Map<String, Object> m = new LinkedHashMap<>();
		m.put("estado", c.getEstado().name());
		m.put("comandoId", c.getId());
		m.put("origen", c.getOrigen().name());
		m.put("actualizadoEn", ms(actualizadoEn));
		return m;
	}

	/** tipoSensor y valor son null en las alertas del sistema; Firebase omite los null. */
	private static Map<String, Object> alerta(Alerta a) {
		Map<String, Object> m = new LinkedHashMap<>();
		m.put("tipoSensor", a.getTipo() == null ? null : a.getTipo().getCodigo());
		m.put("severidad", a.getSeveridad().name());
		m.put("mensaje", a.getMensaje());
		m.put("valor", numero(a.getValor()));
		m.put("creadaEn", ms(a.getCreadaEn()));
		return m;
	}

	/** Firebase guarda números de punto flotante, no BigDecimal. */
	private static Double numero(BigDecimal valor) {
		return valor == null ? null : valor.doubleValue();
	}

	private static Long ms(Instant instante) {
		return instante == null ? null : instante.toEpochMilli();
	}

}
