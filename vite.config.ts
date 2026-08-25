import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv, type PluginOption, defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Plugin inline que sustituye los placeholders `__VITE_FIREBASE_*__` del
 * service worker de Firebase Cloud Messaging (`public/firebase-messaging-sw.js`)
 * por los valores de `.env` en tiempo de build. Así la configuración vive en
 * un único lugar (las variables de entorno) y no se duplica en el SW.
 */
function firebaseMessagingSwPlugin(env: Record<string, string>): PluginOption {
  return {
    name: 'bookcompass-firebase-messaging-sw-env',
    apply: 'build',
    closeBundle() {
      const swPath = resolve(process.cwd(), 'dist', 'firebase-messaging-sw.js');
      if (!existsSync(swPath)) {
        return;
      }
      let content = readFileSync(swPath, 'utf8');
      for (const [key, value] of Object.entries(env)) {
        content = content.replaceAll(`__${key}__`, value);
      }
      writeFileSync(swPath, content);
    },
  };
}

/**
 * Configuración de Vite para Book Compass.
 *
 * - React + TailwindCSS v4 (plugin nativo de Vite).
 * - PWA mediante vite-plugin-pwa con manifest completo y Workbox.
 * - Runtime caching para la API de Open Library:
 *   - Portadas (covers.openlibrary.org): CacheFirst, son recursos inmutables.
 *   - Respuestas JSON (openlibrary.org): NetworkFirst con timeout de red,
 *     para servir contenido fresco y caer a caché si no hay conexión.
 * - Cloud Messaging: el SW generado importa `firebase-messaging-sw.js`
 *   (mensajes en segundo plano).
 */
export default defineConfig(({ mode }) => {
  const firebaseEnv = loadEnv(mode, process.cwd(), 'VITE_FIREBASE_');

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          id: '/',
          name: 'Book Compass',
          short_name: 'BookCompass',
          description:
            'Descubre tu próxima lectura favorita explorando el catálogo de Open Library.',
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
          // Integra el SW de Firebase Cloud Messaging en el SW principal.
          importScripts: ['/firebase-messaging-sw.js'],
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
      firebaseMessagingSwPlugin(firebaseEnv),
    ],
  };
});
