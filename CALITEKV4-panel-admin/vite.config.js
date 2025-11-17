import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer les console.log en production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Supprimer ces fonctions
      },
      mangle: {
        properties: {
          regex: /^_/ // Obfusquer les propriétés commençant par _
        }
      }
    },
    rollupOptions: {
      output: {
        // Obfusquer les noms de fichiers
        entryFileNames: 'assets/[hash].js',
        chunkFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash].[ext]'
      }
    }
  },
  server: {
    port: 5173, // Port par défaut de Vite
    proxy: {
      '/api': {
        target: 'http://localhost:8787', // Worker Cloudflare en développement
        changeOrigin: true
      }
    }
  }
})
