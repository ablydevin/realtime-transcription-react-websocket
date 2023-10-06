import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { pluginAPI } from 'vite-plugin-api'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    pluginAPI({})
  ],
  server: {
    headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  build: {
    rollupOptions: {
      //external: new RegExp('.api/*.*')
    }
  }
})
