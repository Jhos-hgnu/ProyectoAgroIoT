# AgroIoT

Maceta con ESP32 y sensores que envía lecturas a una API (Spring Boot), guarda el historial en PostgreSQL, publica el estado en vivo en Firebase y lo muestra en un dashboard en React.

```
backend/    API en Java 21 + Spring Boot (Maven)
frontend/   React + TypeScript (Vite)
db/         schema.sql y consultas.sql
```

## Requisitos

- Java 21, Node 20+ y Docker (o una base en Neon).

## Levantar todo en local

1. **Base de datos** (PostgreSQL 16 con `db/schema.sql` ya cargado; base, usuario y clave `agroiot`):

   ```bash
   docker compose up -d
   # Si el puerto 5432 está ocupado:  DB_PORT=5433 docker compose up -d
   ```

   Para reiniciar la base desde cero: `docker compose down -v && docker compose up -d`.

2. **Backend** (http://localhost:8080/api):

   ```bash
   cd backend
   cp .env.example .env      # ajusta los valores
   set -a && . ./.env && set +a
   ./mvnw spring-boot:run
   ```

   Comprobación: `curl http://localhost:8080/api/salud`

3. **Frontend** (http://localhost:5173):

   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

## Secretos

Nunca se suben `.env`, llaves de Firebase ni API keys. Usa los archivos `.env.example` como plantilla.
