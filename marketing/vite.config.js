import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // For local dev, the PHP handlers are served by Apache at:
  //   http://localhost/ulnovatech/php/...
  // We proxy /php/* from Vite to Apache so fetch('/php/..') works.
  const apacheBase = env.VITE_APACHE_BASE || 'http://localhost/ulnovatech'

  return {
    plugins: [react()],
    base: '/',
    server: {
      port: Number(env.VITE_PORT) || 5176,
      host: true,
      proxy: {
        '/php': {
          target: apacheBase,
          changeOrigin: true,
          secure: false,
        },
        '/assets': {
          target: apacheBase,
          changeOrigin: true,
          secure: false,
        },
        '/forms': {
          target: apacheBase,
          changeOrigin: true,
          secure: false,
        },
        '/portfolio/api': {
          target: apacheBase,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
