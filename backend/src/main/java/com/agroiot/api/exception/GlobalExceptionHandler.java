package com.agroiot.api.exception;

import java.time.Instant;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/** Todos los errores salen con el formato del contrato: { codigo, mensaje, timestamp }. */
@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(ApiException.class)
	public ResponseEntity<com.agroiot.api.dto.ErrorResponse> api(ApiException ex) {
		return respuesta(ex.getStatus(), ex.getCodigo(), ex.getMessage());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<com.agroiot.api.dto.ErrorResponse> cuerpoInvalido(MethodArgumentNotValidException ex) {
		String detalle = ex.getBindingResult().getFieldErrors().stream()
				.map(e -> e.getField() + ": " + e.getDefaultMessage())
				.collect(Collectors.joining("; "));
		return respuesta(HttpStatus.BAD_REQUEST, "VALIDACION", detalle);
	}

	@ExceptionHandler(HandlerMethodValidationException.class)
	public ResponseEntity<com.agroiot.api.dto.ErrorResponse> parametroInvalido(HandlerMethodValidationException ex) {
		return respuesta(HttpStatus.BAD_REQUEST, "VALIDACION", "Parámetros inválidos");
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<com.agroiot.api.dto.ErrorResponse> jsonInvalido(HttpMessageNotReadableException ex) {
		return respuesta(HttpStatus.BAD_REQUEST, "VALIDACION", "JSON inválido o con tipos incorrectos");
	}

	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<com.agroiot.api.dto.ErrorResponse> tipoInvalido(MethodArgumentTypeMismatchException ex) {
		return respuesta(HttpStatus.BAD_REQUEST, "VALIDACION", "Valor inválido para " + ex.getName());
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<com.agroiot.api.dto.ErrorResponse> otro(Exception ex) {
		// Errores propios de Spring MVC (ruta inexistente, método no permitido...): se respeta su código HTTP.
		if (ex instanceof ErrorResponse er) {
			HttpStatusCode status = er.getStatusCode();
			String codigo = status.value() == 400 ? "VALIDACION" : HttpStatus.valueOf(status.value()).name();
			return respuesta(status, codigo, ex.getMessage());
		}
		log.error("Error no controlado", ex);
		return respuesta(HttpStatus.INTERNAL_SERVER_ERROR, "ERROR_INTERNO", "Error interno del servidor");
	}

	private static ResponseEntity<com.agroiot.api.dto.ErrorResponse> respuesta(HttpStatusCode status, String codigo,
			String mensaje) {
		return ResponseEntity.status(status)
				.body(new com.agroiot.api.dto.ErrorResponse(codigo, mensaje, Instant.now()));
	}

}
