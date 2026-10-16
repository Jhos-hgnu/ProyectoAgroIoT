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

	public static ApiException sinMedicionesValidas(String mensaje) {
		return new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "SIN_MEDICIONES_VALIDAS", mensaje);
	}

	public static ApiException noImplementado(String ruta) {
		return new ApiException(HttpStatus.NOT_IMPLEMENTED, "NO_IMPLEMENTADO", "Endpoint aún no implementado: " + ruta);
	}

	public HttpStatus getStatus() {
		return status;
	}

	public String getCodigo() {
		return codigo;
	}

}
