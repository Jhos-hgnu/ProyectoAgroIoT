package com.agroiot.api.controller;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
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
import com.agroiot.api.service.AlertaService;
import com.agroiot.api.service.DispositivoService;
import com.agroiot.api.service.MedicionService;
import com.agroiot.api.service.ReporteService;
import com.agroiot.api.service.RiegoService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/dispositivos/{id}")
public class DispositivoController {

	private final DispositivoService dispositivos;
	private final MedicionService mediciones;
	private final RiegoService riegos;
	private final AlertaService alertas;
	private final ReporteService reportes;

	public DispositivoController(DispositivoService dispositivos, MedicionService mediciones, RiegoService riegos,
			AlertaService alertas, ReporteService reportes) {
		this.dispositivos = dispositivos;
		this.mediciones = mediciones;
		this.riegos = riegos;
		this.alertas = alertas;
		this.reportes = reportes;
	}

	@GetMapping
	public DispositivoResponse obtener(@PathVariable String id) {
		return dispositivos.obtener(id);
	}

	@PatchMapping
	public DispositivoResponse actualizar(@PathVariable String id,
			@Valid @RequestBody(required = false) DispositivoPatchRequest req) {
		return dispositivos.actualizar(id, req);
	}

	/** tipos separados por coma; desde/hasta en ISO-8601 (por defecto, últimas 24 h). */
	@GetMapping("/mediciones")
	public MedicionesResponse mediciones(@PathVariable String id,
			@RequestParam(required = false) Instant desde,
			@RequestParam(required = false) Instant hasta,
			@RequestParam(required = false) List<String> tipos,
			@RequestParam(defaultValue = "NINGUNA") Agrupacion agrupacion) {
		return mediciones.consultar(id, desde, hasta, tipos, agrupacion);
	}

	/** Botón "Regar ahora". 202: el comando queda PENDIENTE hasta que el ESP32 lo recoja. */
	@PostMapping("/riegos")
	@ResponseStatus(HttpStatus.ACCEPTED)
	public RiegoResponse regar(@PathVariable String id, @Valid @RequestBody(required = false) RiegoRequest req) {
		return riegos.regarAhora(id, req == null ? null : req.duracionSeg());
	}

	@GetMapping("/riegos")
	public List<RiegoResponse> riegos(@PathVariable String id,
			@RequestParam(defaultValue = "20") @Min(1) @Max(100) int limite) {
		return riegos.historial(id, limite);
	}

	/** estado = ACTIVA (por defecto) o TODAS. */
	@GetMapping("/alertas")
	public List<AlertaResponse> alertas(@PathVariable String id,
			@RequestParam(defaultValue = "ACTIVA") String estado,
			@RequestParam(defaultValue = "50") @Min(1) @Max(200) int limite) {
		return alertas.listar(id, estado, limite);
	}

	/** Reporte de IA de las últimas {horas} horas (1 a 72, por defecto 24). Tarda unos segundos: llama a Gemini. */
	@PostMapping("/reportes")
	@ResponseStatus(HttpStatus.CREATED)
	public ReporteResponse generarReporte(@PathVariable String id,
			@Valid @RequestBody(required = false) ReporteRequest req) {
		int horas = req == null || req.horas() == null ? ReporteRequest.HORAS_POR_DEFECTO : req.horas();
		return reportes.generar(id, horas);
	}

	@GetMapping("/reportes")
	public List<ReporteResumen> reportes(@PathVariable String id,
			@RequestParam(defaultValue = "20") @Min(1) @Max(100) int limite) {
		return reportes.listar(id, limite);
	}

	/** ESP32 (X-Api-Key). 200 con el comando o 204 si no hay. */
	@GetMapping("/comandos/pendiente")
	public ResponseEntity<ComandoEntregado> comandoPendiente(@PathVariable String id) {
		throw ApiException.noImplementado("GET /dispositivos/{id}/comandos/pendiente");
	}

}
