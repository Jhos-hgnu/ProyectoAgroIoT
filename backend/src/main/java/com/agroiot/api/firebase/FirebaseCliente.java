package com.agroiot.api.firebase;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.agroiot.api.config.AppProperties;
import com.google.api.core.ApiFuture;
import com.google.api.core.ApiFutureCallback;
import com.google.api.core.ApiFutures;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.common.util.concurrent.MoreExecutors;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ServerValue;

import jakarta.annotation.PreDestroy;

/**
 * Conexión a Firebase Realtime Database con el Admin SDK. Firebase es opcional: si FIREBASE_DB_URL está vacía,
 * las escrituras se ignoran y /salud dice NO_CONFIGURADO.
 * <p>
 * Reglas de todas las escrituras:
 * <ul>
 * <li>Se hacen después del commit de la transacción actual: si la transacción se revierte, Firebase no cambia.</li>
 * <li>Son asíncronas y un fallo solo se registra en el log: Firebase nunca hace fallar una petición.</li>
 * </ul>
 */
@Component
public class FirebaseCliente {

	private static final Logger log = LoggerFactory.getLogger(FirebaseCliente.class);

	private static final String NOMBRE_APP = "agroiot";
	private static final long ESPERA_SALUD_SEG = 5;

	private final boolean configurado;
	/** null si no está configurado o si no se pudo iniciar. */
	private final DatabaseReference raiz;
	private final FirebaseApp app;

	public FirebaseCliente(AppProperties props) {
		AppProperties.Firebase cfg = props.firebase();
		String url = cfg == null ? null : cfg.dbUrl();
		this.configurado = url != null && !url.isBlank();
		FirebaseApp iniciada = null;
		DatabaseReference referencia = null;
		if (!configurado) {
			log.info("Firebase no configurado (FIREBASE_DB_URL vacía): no se publicará el estado en vivo");
		} else {
			try {
				iniciada = iniciar(url.trim(), cfg.credentials());
				referencia = FirebaseDatabase.getInstance(iniciada).getReference();
				log.info("Firebase Realtime Database: {}{}", url, esEmulador(url) ? " (emulador)" : "");
			} catch (IOException | RuntimeException | LinkageError e) {
				// LinkageError: p. ej. falta una clase del SDK. Firebase es opcional, así que la API arranca igual.
				log.error("No se pudo iniciar Firebase, la API sigue sin estado en vivo: {}", e.toString());
			}
		}
		this.app = iniciada;
		this.raiz = referencia;
	}

	/** true si hay FIREBASE_DB_URL y la conexión se pudo iniciar. */
	public boolean configurado() {
		return raiz != null;
	}

	/** Reemplaza el nodo en la ruta (relativa a la raíz). valor null borra el nodo. */
	public void reemplazar(String ruta, Object valor) {
		despuesDelCommit(ruta, () -> raiz.child(ruta).setValueAsync(valor));
	}

	/** Actualiza solo los hijos indicados del nodo; las llaves pueden ser rutas ("sensores/TEMPERATURA"). */
	public void actualizar(String ruta, Map<String, Object> cambios) {
		despuesDelCommit(ruta, () -> raiz.child(ruta).updateChildrenAsync(cambios));
	}

	/** Para /salud: escribe salud/revisadaEn y espera la confirmación del servidor. */
	public String revisar() {
		if (!configurado) {
			return "NO_CONFIGURADO";
		}
		if (raiz == null) {
			return "ERROR";
		}
		try {
			raiz.child("salud/revisadaEn").setValueAsync(ServerValue.TIMESTAMP).get(ESPERA_SALUD_SEG, TimeUnit.SECONDS);
			return "OK";
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			return "ERROR";
		} catch (ExecutionException | TimeoutException e) {
			log.warn("Salud: Firebase no responde: {}", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
			return "ERROR";
		}
	}

	@PreDestroy
	void cerrar() {
		if (app != null) {
			app.delete();
		}
	}

	private void despuesDelCommit(String ruta, EscrituraFirebase escritura) {
		if (raiz == null) {
			return;
		}
		Runnable ejecutar = () -> {
			try {
				ApiFutures.addCallback(escritura.iniciar(), new ApiFutureCallback<Void>() {
					@Override
					public void onFailure(Throwable t) {
						log.warn("Firebase: falló la escritura en {}: {}", ruta, t.getMessage());
					}

					@Override
					public void onSuccess(Void resultado) {
					}
				}, MoreExecutors.directExecutor());
			} catch (RuntimeException e) {
				log.warn("Firebase: no se pudo escribir en {}: {}", ruta, e.getMessage());
			}
		};
		if (TransactionSynchronizationManager.isSynchronizationActive()) {
			TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
				@Override
				public void afterCommit() {
					ejecutar.run();
				}
			});
		} else {
			ejecutar.run();
		}
	}

	private static FirebaseApp iniciar(String url, String credenciales) throws IOException {
		for (FirebaseApp existente : FirebaseApp.getApps()) {
			if (existente.getName().equals(NOMBRE_APP)) {
				existente.delete(); // p. ej. otro contexto de Spring en las pruebas
			}
		}
		FirebaseOptions opciones = FirebaseOptions.builder()
				.setDatabaseUrl(url)
				.setCredentials(esEmulador(url) ? credencialesEmulador() : credencialesServiceAccount(credenciales))
				.build();
		return FirebaseApp.initializeApp(opciones, NOMBRE_APP);
	}

	/** El emulador se reconoce por la URL: http://host:puerto?ns=<base>. */
	private static boolean esEmulador(String url) {
		return url.startsWith("http://") && url.contains("ns=");
	}

	/**
	 * El emulador acepta el token "owner" como administrador; no hace falta una llave real.
	 * El SDK exige una fecha de expiración para programar la renovación, así que se renueva cada hora.
	 */
	private static GoogleCredentials credencialesEmulador() {
		return new GoogleCredentials() {
			@Override
			public AccessToken refreshAccessToken() {
				return new AccessToken("owner", Date.from(Instant.now().plus(Duration.ofHours(1))));
			}
		};
	}

	/** FIREBASE_CREDENTIALS: el JSON completo de la service account o la ruta al archivo. */
	private static GoogleCredentials credencialesServiceAccount(String credenciales) throws IOException {
		if (credenciales == null || credenciales.isBlank()) {
			throw new IllegalStateException("FIREBASE_CREDENTIALS está vacía");
		}
		String valor = credenciales.trim();
		try (InputStream in = valor.startsWith("{")
				? new ByteArrayInputStream(valor.getBytes(StandardCharsets.UTF_8))
				: new FileInputStream(valor)) {
			return GoogleCredentials.fromStream(in);
		}
	}

	@FunctionalInterface
	private interface EscrituraFirebase {
		ApiFuture<Void> iniciar();
	}

}
