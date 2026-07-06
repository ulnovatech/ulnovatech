import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/dash/' : '/ulndash/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost/ulnovatech',
        changeOrigin: true,
        secure: false,
      },
    },
  },
}))
