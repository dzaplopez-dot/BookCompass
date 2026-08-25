/*
 * Service Worker de Firebase Cloud Messaging (notificaciones en segundo plano).
 *
 * Este archivo se registra dentro del service worker principal generado por
 * vite-plugin-pwa (vía workbox.importScripts). Los placeholders
 * __VITE_FIREBASE_*__ se sustituyen por las credenciales reales durante el
 * build (plugin bookcompass-firebase-messaging-sw-env en vite.config.ts).
 */

importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '__VITE_FIREBASE_API_KEY__',
  authDomain: '__VITE_FIREBASE_AUTH_DOMAIN__',
  projectId: '__VITE_FIREBASE_PROJECT_ID__',
  storageBucket: '__VITE_FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: '__VITE_FIREBASE_MESSAGING_SENDER_ID__',
  appId: '__VITE_FIREBASE_APP_ID__',
});

try {
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification ?? {};
    self.registration.showNotification(notification.title || 'Book Compass', {
      body: notification.body || '',
      icon: '/pwa-192x192.png',
      data: payload.data,
    });
  });
} catch (error) {
  // Navegador sin soporte de mensajería push: el resto de la PWA sigue funcionando.
  console.warn('[BookCompass] Mensajería push no disponible:', error);
}
