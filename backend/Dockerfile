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

# Opciones para el plan gratuito de Render (512 MB y 0.1 CPU), medidas con docker run --memory=512m --cpus=0.1:
# - MaxRAMPercentage=60: heap de hasta ~300 MB; el resto queda para metaspace, hilos y buffers.
# - SerialGC y TieredStopAtLevel=1 (solo el compilador C1): mucho menos trabajo de CPU al arrancar.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=60 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k -XX:ReservedCodeCacheSize=64M"

# El jar extraído + un archivo CDS con las clases que carga el arranque (lo recomienda Spring Boot para arrancar
# más rápido). El entrenamiento corre sin base de datos: no valida el esquema ni abre conexiones, solo carga clases.
COPY --from=build /app/target/*.jar app.jar
RUN java -Djarmode=tools -jar app.jar extract --destination extraido && rm app.jar \
    && cd extraido \
    && DB_URL=jdbc:postgresql://localhost:5432/entrenamiento DB_USER=x DB_PASSWORD=x \
       java $JAVA_OPTS -XX:ArchiveClassesAtExit=app.jsa -Dspring.context.exit=onRefresh \
            -Dspring.jpa.hibernate.ddl-auto=none \
            -Dspring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false \
            -Dspring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect \
            -Dspring.datasource.hikari.initialization-fail-timeout=-1 \
            -jar app.jar \
    && chown -R agroiot /app/extraido
USER agroiot
WORKDIR /app/extraido

# Render inyecta PORT; la app escucha en ${PORT:8080} (ver application.properties).
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -XX:SharedArchiveFile=app.jsa -jar app.jar"]
