/**
 * Tipos compartidos del dominio de Book Compass.
 *
 * Este módulo NO depende de ningún SDK: los servicios consumen y exponen
 * exclusivamente estos tipos, de modo que las capas superiores (hooks,
 * contextos, UI) permanezcan desacopladas de Firebase u otro proveedor.
 */

/** Función para cancelar una suscripción (patrón observable). */
export type Unsubscribe = () => void;

/** Usuario autenticado normalizado del dominio de la aplicación. */
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/** Documento de perfil de usuario almacenado en Firestore (`users/{uid}`). */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  /** Fecha de creación en milisegundos desde epoch. */
  createdAt: number;
  /** Fecha de la última actualización en milisegundos desde epoch. */
  updatedAt: number;
}

/** Documento genérico con su identificador inyectado. */
export type WithId = { id: string };

/** Payload simplificado y agnóstico de un mensaje push (FCM). */
export interface FcmPayload {
  title?: string;
  body?: string;
  /** Datos personalizados adjuntos al mensaje. */
  data?: Record<string, string>;
}
