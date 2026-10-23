import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Opcional, solo en `npm run dev`: con API_PROXY_TARGET y VITE_API_URL=/api, las peticiones a /api
  // pasan por Vite hacia esa API (p. ej. la de Render) sin depender de su CORS_ORIGINS.
  const proxyTarget = loadEnv(mode, process.cwd(), '').API_PROXY_TARGET

  return {
    plugins: [react()],
    server: proxyTarget
      ? {
          proxy: {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              // Sin Origin la petición no es de navegador y la API no aplica CORS.
              configure: (proxy) => {
                proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
              },
            },
          },
        }
      : undefined,
  }
})
