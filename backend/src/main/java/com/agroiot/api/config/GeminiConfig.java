package com.agroiot.api.config;

import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.retry.RetryPolicy;
import org.springframework.core.retry.RetryTemplate;

import com.google.genai.Client;
import com.google.genai.types.HttpOptions;

/**
 * Modelo de Gemini para los reportes de IA (Gemini Developer API, con la key de Google AI Studio).
 * Solo se crea si hay GEMINI_API_KEY: sin ella la API arranca igual y POST /reportes responde 502 IA_NO_DISPONIBLE.
 */
@Configuration
@ConditionalOnExpression("!'${agroiot.gemini.api-key:}'.isBlank()")
public class GeminiConfig {

	private static final Logger log = LoggerFactory.getLogger(GeminiConfig.class);

	/** Un reporte tarda unos segundos; más de 60 s se considera caído. */
	private static final int TIEMPO_MAXIMO_MS = 60_000;

	@Bean
	ChatModel geminiChatModel(AppProperties props) {
		AppProperties.Gemini cfg = props.gemini();
		Client cliente = Client.builder()
				.apiKey(cfg.apiKey().trim())
				.httpOptions(HttpOptions.builder().timeout(TIEMPO_MAXIMO_MS).build())
				.build();
		// Un solo reintento: el frontend espera la respuesta y la cuota gratuita responde 429 al saturarse.
		RetryTemplate reintentos = new RetryTemplate(
				RetryPolicy.builder().maxRetries(1).delay(Duration.ofSeconds(2)).build());
		log.info("Reportes de IA con Gemini, modelo {}", cfg.model());
		return GoogleGenAiChatModel.builder()
				.genAiClient(cliente)
				.options(GoogleGenAiChatOptions.builder().model(cfg.model()).temperature(0.3).build())
				.retryTemplate(reintentos)
				.build();
	}

}
