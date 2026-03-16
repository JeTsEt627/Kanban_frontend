import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Прокси для backend (если backend запущен на localhost:8000)
      '/api': 'http://localhost:8000'
    }
  }
})
