import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // Electron 42 ships a modern Chromium — no need for legacy JS transforms
    target: 'esnext',
    // Single CSS file is simpler for a file://-loaded desktop app
    cssCodeSplit: false,
  },
})
