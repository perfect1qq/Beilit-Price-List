import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// 构建版本号（每次修改会强制重新构建）
const BUILD_VERSION = `2026-04-24-v4.0`

// https://vite.dev/config/
export default defineConfig({

  plugins: [
    vue(),
    vueJsx(),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: 'css' })]
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 }
            }
          }
        ]
      },
      manifest: {
        name: 'Beilit Price List',
        short_name: 'Beilit',
        theme_color: '#2563eb',
        icons: [
          { src: 'logo.png', sizes: '192x192', type: 'image/png' },
          { src: 'logo.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    }),
    visualizer({
      filename: 'stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
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
            if (id.includes('@element-plus/icons-vue')) return 'vendor-element-icons'
            if (id.includes('element-plus')) return 'vendor-element-plus'
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
      drop: ['debugger'],
      pure: ['console.log']
    }
  }
})

