import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apacheBase = env.VITE_APACHE_BASE || 'http://localhost/ulnovatech'

  return {
    plugins: [react()],
    base: './',
    server: {
      port: Number(env.VITE_PORT) || 5177,
      host: true,
      proxy: {
        '/api': {
          target: apacheBase,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  }
})
