import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // MapLibre's worker is an ES module that imports a shared chunk
  worker: { format: 'es' },
  // The lazily-loaded globe map chunk (MapLibre) is ~1 MB; the main bundle stays small
  build: { chunkSizeWarningLimit: 1100 },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
})
