/**
 * Servicio de notificaciones push con Firebase Cloud Messaging.
 *
 * Responsabilidad única: permisos de notificación, registro del token Web
 * Push y mensajes recibidos con la app en primer plano. En navegadores sin
 * soporte todos los métodos operan de forma segura sin romper la app.
 *
 * Los mensajes en segundo plano los gestiona `public/firebase-messaging-sw.js`.
 *
 * Uso: importa el singleton `messagingService`.
 */
import { getToken, onMessage } from 'firebase/messaging';
import { readFirebaseEnv } from '../config/env';
import { getMessagingInstance } from '../config/firebase';
import type { FcmPayload, Unsubscribe } from '../types';
import { normalizeError } from '../utils/errors';

/** Servicio de mensajería push de Book Compass. */
export class MessagingService {
  /** Indica si el navegador actual soporta mensajería push. */
  async isSupported(): Promise<boolean> {
    return (await getMessagingInstance()) !== null;
  }

  /**
   * Solicita permiso de notificaciones (si es necesario) y devuelve el token
   * de registro para Web Push, o `null` si no se pudo obtener.
   */
  async requestPermissionAndGetToken(): Promise<string | null> {
    try {
      const messaging = await getMessagingInstance();
      if (!messaging || Notification.permission === 'denied') {
        return null;
      }

      if (Notification.permission !== 'granted') {
        const requested = await Notification.requestPermission();
        if (requested !== 'granted') {
          return null;
        }
      }

      return await getToken(messaging, { vapidKey: readFirebaseEnv().vapidKey });
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Escucha mensajes mientras la aplicación está en primer plano.
   *
   * @returns Función para cancelar la suscripción.
   */
  onForegroundMessage(listener: (payload: FcmPayload) => void): Unsubscribe {
    let unsubscribeSdk: Unsubscribe | null = null;
    let cancelled = false;

    // Obtener la instancia es asíncrono: la suscripción se difiere y
    // `cancelled` evita registrarla si ya se canceló antes de resolverse.
    void (async () => {
      const messaging = await getMessagingInstance();
      if (cancelled || !messaging) {
        return;
      }
      unsubscribeSdk = onMessage(messaging, (message) => {
        listener({
          title: message.notification?.title,
          body: message.notification?.body,
          data: message.data as Record<string, string> | undefined,
        });
      });
    })();

    return () => {
      cancelled = true;
      unsubscribeSdk?.();
    };
  }
}

/** Instancia única del servicio de mensajería para toda la aplicación. */
export const messagingService = new MessagingService();
