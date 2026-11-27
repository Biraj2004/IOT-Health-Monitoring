import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const backendTarget = process.env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8000'

const proxyConfig = {
  '/api': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/ws': {
    target: backendTarget,
    ws: true,
    changeOrigin: true,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: proxyConfig,
  },
  preview: {
    proxy: proxyConfig,
  },
})
