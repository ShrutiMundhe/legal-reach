import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(),
    basicSsl()
  ],
  server: {
    host: '0.0.0.0',
    port: 5174,
    https: true,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  define: {
    global: 'window', 
  },
})