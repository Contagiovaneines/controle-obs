import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// host: true expõe o servidor na rede local (0.0.0.0), essencial
// para acessar pelo IP do PC a partir do iPhone.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  preview: {
    host: true,
    port: 4173
  }
})
