package com.agroiot.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** CORS global para /api/** con los orígenes de CORS_ORIGINS. */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

	private final AppProperties props;

	public CorsConfig(AppProperties props) {
		this.props = props;
	}

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		String[] origenes = props.corsOrigins() == null ? new String[0]
				: props.corsOrigins().stream().map(String::trim).filter(o -> !o.isEmpty()).toArray(String[]::new);
		registry.addMapping("/api/**")
				.allowedOrigins(origenes)
				.allowedMethods("GET", "POST", "PATCH", "OPTIONS")
				.allowedHeaders("*")
				.maxAge(3600);
	}

}
