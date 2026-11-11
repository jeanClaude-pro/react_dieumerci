import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import type { Plugin } from 'vite'

// Content-Security-Policy for the built app: only this site's own scripts may
// run, and the app may only talk to itself and the configured API. An
// injected script (XSS) can therefore neither run inline nor send data away.
function contentSecurityPolicy(apiOrigin: string): Plugin {
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin}`.trim(),
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
  return {
    name: 'inject-content-security-policy',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
      )
    },
  }
}

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
  const isProduction = mode === 'production'
  const apiOrigin = (() => {
    try { return apiUrl ? new URL(apiUrl).origin : '' } catch { return '' }
  })()

  return {
    // Production builds contain no console output and no debugger
    // statements, and ship no source maps (the original code stays private).
    esbuild: isProduction ? { drop: ['console', 'debugger'], legalComments: 'none' } : undefined,
    build: { sourcemap: false },
    plugins: [
    react(),
    tailwindcss(),
    ...(isProduction ? [contentSecurityPolicy(apiOrigin)] : []),
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
        background_color: '#f7f5ef',
        theme_color: '#24613f',
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
