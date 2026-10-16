# AgroIoT — frontend

Vite + React + TypeScript. Sin librerías de UI todavía: eso lo decide quien hace el frontend.

```bash
cp .env.example .env   # VITE_API_URL apunta a la API
npm install
npm run dev            # http://localhost:5173
npm run build          # genera dist/ (Render: Static Site)
```

- `src/types/contrato.ts`: tipos exactos de los JSON del contrato.
- `src/api/cliente.ts`: `fetch` contra `VITE_API_URL`; los errores llegan como `ApiError` (`codigo`, `message`, `status`).
- `src/mocks/`: ejemplos JSON del contrato para trabajar sin la API.
- `src/App.tsx`: página mínima con una tarjeta por sensor de `GET /dispositivos/maceta-01` (o del mock si la API no responde).
