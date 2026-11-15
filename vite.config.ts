import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['brand/*.png', 'brand/*.webp', 'brand/*.jpg', 'favicon.ico'],
      manifest: {
        id: '/',
        name: 'أطباء المملكة العربية السعودية',
        short_name: 'أطباء المملكة',
        description: 'رأس مال بشري سعودي نفخر به — ملفك المهني الموثوق في رابط واحد.',
        lang: 'ar',
        dir: 'rtl',
        start_url: '/?source=pwa',
        scope: '/',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'portrait-primary',
        background_color: '#07130D',
        theme_color: '#006830',
        categories: ['medical', 'business', 'productivity'],
        icons: [
          { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/brand/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        shortcuts: [
          { name: 'البحث عن طبيب', short_name: 'بحث', url: '/search', icons: [{ src: '/brand/icon-192.png', sizes: '192x192' }] },
          { name: 'لوحتي', short_name: 'لوحتي', url: '/dashboard', icons: [{ src: '/brand/icon-192.png', sizes: '192x192' }] }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg,webp,jpg,ico}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/media\//, /^\/sitemap\.xml/, /^\/robots\.txt/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /\/media\/.+/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ksd-media-v1',
              expiration: { maxEntries: 80, maxAgeSeconds: 2592000 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /\/api\/public\/.+/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ksd-profiles-v1',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 30, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            urlPattern: /\/api\/(meta|search\/suggest).*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ksd-meta-v1',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 10, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            urlPattern: /^https:\/\/i\.ytimg\.com\/.+/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ksd-yt-v1',
              expiration: { maxEntries: 30, maxAgeSeconds: 604800 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist/client',
    sourcemap: false,
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          qr: ['qrcode']
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8787',
      '/media': 'http://127.0.0.1:8787'
    }
  }
});
