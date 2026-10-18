package com.agroiot.api.exception;

import org.springframework.http.HttpStatus;

/** Error de negocio con su código HTTP y el código del contrato (VALIDACION, RIEGO_EN_CURSO...). */
public class ApiException extends RuntimeException {

	private final HttpStatus status;
	private final String codigo;

	public ApiException(HttpStatus status, String codigo, String mensaje) {
		super(mensaje);
		this.status = status;
		this.codigo = codigo;
	}

	public static ApiException validacion(String mensaje) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDACION", mensaje);
	}

	public static ApiException dispositivoNoEncontrado(String id) {
		return new ApiException(HttpStatus.NOT_FOUND, "DISPOSITIVO_NO_ENCONTRADO", "No existe el dispositivo " + id);
	}

	public static ApiException comandoNoEncontrado(Long id) {
		return new ApiException(HttpStatus.NOT_FOUND, "COMANDO_NO_ENCONTRADO", "No existe el comando " + id);
	}

	public static ApiException alertaNoEncontrada(Long id) {
		return new ApiException(HttpStatus.NOT_FOUND, "ALERTA_NO_ENCONTRADA", "No existe la alerta " + id);
	}

	public static ApiException bombaNoDisponible(String dispositivoId) {
		return new ApiException(HttpStatus.CONFLICT, "BOMBA_NO_DISPONIBLE",
				"El dispositivo " + dispositivoId + " no tiene bomba");
	}

	public static ApiException riegoEnCurso(String dispositivoId) {
		return new ApiException(HttpStatus.CONFLICT, "RIEGO_EN_CURSO",
				"Ya hay un riego pendiente para " + dispositivoId);
	}

	public static ApiException comandoNoEnviado(Long id, String estado) {
		return new ApiException(HttpStatus.CONFLICT, "COMANDO_NO_ENVIADO",
				"El comando " + id + " está " + estado + ", no ENVIADO");
	}

	public static ApiException sinMedicionesValidas(String mensaje) {
		return new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "SIN_MEDICIONES_VALIDAS", mensaje);
	}

	public static ApiException reporteNoEncontrado(Long id) {
		return new ApiException(HttpStatus.NOT_FOUND, "REPORTE_NO_ENCONTRADO", "No existe el reporte " + id);
	}

	public static ApiException datosInsuficientes(String mensaje) {
		return new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "DATOS_INSUFICIENTES", mensaje);
	}

	public static ApiException iaNoDisponible(String mensaje) {
		return new ApiException(HttpStatus.BAD_GATEWAY, "IA_NO_DISPONIBLE", mensaje);
	}

	public HttpStatus getStatus() {
		return status;
	}

	public String getCodigo() {
		return codigo;
	}

}
