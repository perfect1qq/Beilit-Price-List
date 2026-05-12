import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'
import { compression } from 'vite-plugin-compression2'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const BUILD_VERSION = `2026-05-09-v4.1`

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
        globPatterns: ['**/*.{css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/assets/js/**'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/(?!.*(?:login|register|refresh|create|update|delete|submit|add|remove)).*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 }
            }
          },
          {
            urlPattern: /\/api\/.*(?:login|register|refresh|create|update|delete|submit|add|remove).*$/i,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /\/assets\/js\/.+\.js$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'js-chunks-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }
            }
          },
          {
            urlPattern: /\/assets\/css\/.+\.css$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'css-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 7 * 24 * 60 * 60 }
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
    ,
    compression({
      threshold: 10240,
      algorithms: ['brotliCompress']
    })
  ],
  base: '/Beilit-Price-List/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(BUILD_VERSION)
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        chunkFileNames(chunkInfo: { name: string }): string {
          const sanitizedName = chunkInfo.name.replace(/^_+/, 'chunk-')
          return `assets/js/${sanitizedName}-[hash].js`
        },
        entryFileNames(chunkInfo: { name: string }): string {
          const sanitizedName = chunkInfo.name.replace(/^_+/, 'entry-')
          return `assets/js/${sanitizedName}-[hash].js`
        },
        assetFileNames(assetInfo: { name?: string }): string {
          const extension = assetInfo.name?.split('.').pop() ?? 'asset'
          const rawName = assetInfo.name?.slice(0, -(extension.length + 1)) ?? 'asset'
          const sanitizedName = rawName.replace(/^_+/, 'asset-')
          return `assets/${extension}/${sanitizedName}-[hash].[ext]`
        },
        manualChunks(id: string): string | undefined {
          if (id.includes('node_modules')) {
            if (id.includes('@element-plus/icons-vue')) return 'vendor-element-icons'
            if (id.includes('element-plus')) return 'vendor-element-plus'
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) return 'vendor-vue'
            if (id.includes('axios')) return 'vendor-axios'
            if (id.includes('echarts')) return 'vendor-echarts'
            if (id.includes('lodash') || id.includes('lodash-es')) return 'vendor-lodash'
            if (id.includes('dayjs') || id.includes('moment')) return 'vendor-date'
            return 'vendor-misc'
          }
          return undefined
        }
      }
    },
    target: 'es2020',
    cssMinify: 'esbuild',
    minify: 'esbuild',
    modulePreload: {
      resolveDependencies(filename: string, deps: string[]): string[] {
        if (filename.endsWith('entry-') || filename.includes('entry-')) {
          return deps.filter(d => d.includes('vendor-vue'))
        }
        return deps
      }
    },
    esbuild: {
      drop: ['debugger'],
      pure: ['console.log', 'console.warn', 'console.debug']
    }
  } as Record<string, unknown>
})