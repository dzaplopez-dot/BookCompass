import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Configuración de Vite para Book Compass.
 *
 * - React + TailwindCSS v4 (plugin nativo de Vite).
 * - PWA mediante vite-plugin-pwa con manifest completo y Workbox.
 * - Runtime caching para la API de Open Library:
 *   - Portadas (covers.openlibrary.org): CacheFirst, son recursos inmutables.
 *   - Respuestas JSON (openlibrary.org): NetworkFirst con timeout de red,
 *     para servir contenido fresco y caer a caché si no hay conexión.
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        id: '/',
        name: 'Book Compass',
        short_name: 'BookCompass',
        description: 'Descubre tu próxima lectura favorita explorando el catálogo de Open Library.',
        lang: 'es',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf7f2',
        theme_color: '#1c1917',
        categories: ['books', 'education', 'entertainment'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/covers\.openlibrary\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'openlibrary-covers',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/openlibrary\.org\/.*\.json.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'openlibrary-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
});
