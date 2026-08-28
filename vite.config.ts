import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const apiUrl = loadEnv(mode, '.', '').VITE_API_URL?.trim()
  const usesLocalBackend = /^https?:\/\/(localhost|127\.0\.0\.1)(?::|\/|$)/i.test(
    apiUrl || '',
  )

  if (mode === 'production' && (!apiUrl || usesLocalBackend)) {
    throw new Error(
      'Production VITE_API_URL must point to the deployed backend, not localhost.',
    )
  }
  if (mode === 'production' && !apiUrl?.startsWith('https://')) {
    throw new Error('Production VITE_API_URL must use HTTPS.')
  }

  return {
    plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['logo.jpeg'],
      manifest: {
        name: 'ETS. DIEU MERCI',
        short_name: 'DIEU MERCI',
        description: 'Application de gestion ETS. DIEU MERCI',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,woff,woff2}',
        ],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
    ],
  }
})
