import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Honour a harness/CI-assigned port; fall back to Vite's default.
    port: Number(process.env.PORT) || 5173,
  },
})
