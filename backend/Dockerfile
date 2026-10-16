# --- Etapa 1: compilar con Maven ---
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline
COPY src/ src/
RUN ./mvnw -q -B -DskipTests package

# --- Etapa 2: imagen liviana solo con el JRE ---
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 1001 agroiot
COPY --from=build /app/target/*.jar app.jar
USER agroiot

# Render inyecta PORT; la app escucha en ${PORT:8080} (ver application.properties).
ENV PORT=8080
EXPOSE 8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
