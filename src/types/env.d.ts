/// <reference types="vite/client" />

/**
 * Tipado estricto de las variables de entorno de Vite usadas por Book Compass.
 * El acceso en runtime se valida en `src/config/env.ts`.
 */
interface ImportMetaEnv {
  /** Clave de API web de Firebase. */
  readonly VITE_FIREBASE_API_KEY: string;
  /** Dominio de autenticación (p. ej. `bookcompass.firebaseapp.com`). */
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  /** Identificador del proyecto Firebase. */
  readonly VITE_FIREBASE_PROJECT_ID: string;
  /** Bucket de almacenamiento. */
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  /** Identificador del remitente de mensajería. */
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  /** Identificador de la aplicación web de Firebase. */
  readonly VITE_FIREBASE_APP_ID: string;
  /** Clave VAPID para Web Push (Cloud Messaging). */
  readonly VITE_FIREBASE_VAPID_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
