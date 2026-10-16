package com.agroiot.api.controller;

import java.time.Instant;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.agroiot.api.dto.Agrupacion;
import com.agroiot.api.dto.AlertaResponse;
import com.agroiot.api.dto.ComandoEntregado;
import com.agroiot.api.dto.DispositivoPatchRequest;
import com.agroiot.api.dto.DispositivoResponse;
import com.agroiot.api.dto.MedicionesResponse;
import com.agroiot.api.dto.ReporteRequest;
import com.agroiot.api.dto.ReporteResponse;
import com.agroiot.api.dto.ReporteResumen;
import com.agroiot.api.dto.RiegoRequest;
import com.agroiot.api.dto.RiegoResponse;
import com.agroiot.api.exception.ApiException;
import com.agroiot.api.service.DispositivoService;

@RestController
@RequestMapping("/api/dispositivos/{id}")
public class DispositivoController {

	private final DispositivoService dispositivos;

	public DispositivoController(DispositivoService dispositivos) {
		this.dispositivos = dispositivos;
	}

	@GetMapping
	public DispositivoResponse obtener(@PathVariable String id) {
		return dispositivos.obtener(id);
	}

	@PatchMapping
	public DispositivoResponse actualizar(@PathVariable String id,
			@RequestBody(required = false) DispositivoPatchRequest req) {
		throw ApiException.noImplementado("PATCH /dispositivos/{id}");
	}

	@GetMapping("/mediciones")
	public MedicionesResponse mediciones(@PathVariable String id,
			@RequestParam(required = false) Instant desde,
			@RequestParam(required = false) Instant hasta,
			@RequestParam(required = false) List<String> tipos,
			@RequestParam(defaultValue = "NINGUNA") Agrupacion agrupacion) {
		throw ApiException.noImplementado("GET /dispositivos/{id}/mediciones");
	}

	/** Responde 202 cuando se implemente. */
	@PostMapping("/riegos")
	public RiegoResponse regar(@PathVariable String id, @RequestBody(required = false) RiegoRequest req) {
		throw ApiException.noImplementado("POST /dispositivos/{id}/riegos");
	}

	@GetMapping("/riegos")
	public List<RiegoResponse> riegos(@PathVariable String id, @RequestParam(defaultValue = "20") int limite) {
		throw ApiException.noImplementado("GET /dispositivos/{id}/riegos");
	}

	/** estado = ACTIVA (por defecto) o TODAS. */
	@GetMapping("/alertas")
	public List<AlertaResponse> alertas(@PathVariable String id,
			@RequestParam(defaultValue = "ACTIVA") String estado) {
		throw ApiException.noImplementado("GET /dispositivos/{id}/alertas");
	}

	/** Responde 201 cuando se implemente. */
	@PostMapping("/reportes")
	public ReporteResponse generarReporte(@PathVariable String id,
			@RequestBody(required = false) ReporteRequest req) {
		throw ApiException.noImplementado("POST /dispositivos/{id}/reportes");
	}

	@GetMapping("/reportes")
	public List<ReporteResumen> reportes(@PathVariable String id) {
		throw ApiException.noImplementado("GET /dispositivos/{id}/reportes");
	}

	/** ESP32 (X-Api-Key). 200 con el comando o 204 si no hay. */
	@GetMapping("/comandos/pendiente")
	public ResponseEntity<ComandoEntregado> comandoPendiente(@PathVariable String id) {
		throw ApiException.noImplementado("GET /dispositivos/{id}/comandos/pendiente");
	}

}
