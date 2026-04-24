import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// 构建版本号（每次修改会强制重新构建）
const BUILD_VERSION = `2026-04-24-v4.0`

// https://vite.dev/config/
export default defineConfig({

  plugins: [vue()],
  base: '/Beilit-Price-List/',
  define: {
    __APP_VERSION__: JSON.stringify(BUILD_VERSION)
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    chunkFileWarningLimit: 500,
    rollupOptions: {
      output: {
        chunkFileNames(chunkInfo) {
          const sanitizedName = chunkInfo.name.replace(/^_+/, 'chunk-')
          return `assets/js/${sanitizedName}-[hash].js`
        },
        entryFileNames(chunkInfo) {
          const sanitizedName = chunkInfo.name.replace(/^_+/, 'entry-')
          return `assets/js/${sanitizedName}-[hash].js`
        },
        assetFileNames(assetInfo) {
          const extension = assetInfo.name?.split('.').pop() ?? 'asset'
          const rawName = assetInfo.name?.slice(0, -(extension.length + 1)) ?? 'asset'
          const sanitizedName = rawName.replace(/^_+/, 'asset-')
          return `assets/${extension}/${sanitizedName}-[hash].[ext]`
        },
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('element-plus') || id.includes('@element-plus')) return 'vendor-element-plus'
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) return 'vendor-vue'
            if (id.includes('axios')) return 'vendor-axios'
            return 'vendor-misc'
          }
          return undefined
        }
      }
    },
    target: 'es2020',
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger']
    }
  }
})

