import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vite.dev/config/
export default defineConfig({

  plugins: [vue()],
  base: '/Beilit-Price-List/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    chunkFileWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('element-plus') || id.includes('@element-plus')) return 'vendor-element-plus'
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) return 'vendor-vue'
            if (id.includes('axios')) return 'vendor-axios'
            return 'vendor-misc'
          }
          return undefined
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    target: 'es2020',
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger']
    }
  }
})

