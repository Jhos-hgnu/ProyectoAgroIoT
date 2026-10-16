package com.agroiot.api.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import com.agroiot.api.config.AppProperties;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Valida X-Api-Key solo en los endpoints que usa el ESP32. Si DEVICE_API_KEY no está configurada,
 * esos endpoints se rechazan siempre (falla cerrado).
 */
@Component
public class ApiKeyFilter extends OncePerRequestFilter {

	public static final String HEADER = "X-Api-Key";

	private record Ruta(HttpMethod metodo, String patron) {
	}

	private static final List<Ruta> PROTEGIDAS = List.of(
			new Ruta(HttpMethod.POST, "/api/lecturas"),
			new Ruta(HttpMethod.POST, "/api/comandos/*/confirmacion"),
			new Ruta(HttpMethod.GET, "/api/dispositivos/*/comandos/pendiente"));

	private final AntPathMatcher matcher = new AntPathMatcher();
	private final byte[] claveEsperada;

	public ApiKeyFilter(AppProperties props) {
		String clave = props.deviceApiKey();
		this.claveEsperada = clave == null || clave.isBlank() ? null : clave.getBytes(StandardCharsets.UTF_8);
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		String ruta = request.getRequestURI().substring(request.getContextPath().length());
		return PROTEGIDAS.stream().noneMatch(
				r -> r.metodo().matches(request.getMethod()) && matcher.match(r.patron(), ruta));
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String recibida = request.getHeader(HEADER);
		if (claveEsperada != null && recibida != null
				&& MessageDigest.isEqual(claveEsperada, recibida.getBytes(StandardCharsets.UTF_8))) {
			chain.doFilter(request, response);
			return;
		}
		String mensaje = recibida == null ? "Falta el encabezado X-Api-Key" : "X-Api-Key incorrecta";
		response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setCharacterEncoding(StandardCharsets.UTF_8.name());
		response.getWriter().write("{\"codigo\":\"NO_AUTORIZADO\",\"mensaje\":\"" + mensaje
				+ "\",\"timestamp\":\"" + Instant.now().truncatedTo(ChronoUnit.MILLIS) + "\"}");
	}

}
