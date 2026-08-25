/**
 * Lectura tipada y validada de las variables de entorno de Firebase.
 *
 * Estrategia *fail-fast*: si falta alguna variable obligatoria se lanza un
 * error descriptivo en el primer acceso, en lugar de fallar más tarde con
 * mensajes crípticos del SDK.
 */

/** Configuración de Firebase lista para inicializar el SDK. */
export interface FirebaseEnvConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  /** Clave VAPID necesaria para registrar tokens de Web Push. */
  vapidKey: string;
}

/** Variables de entorno obligatorias para el funcionamiento de Firebase. */
export const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_VAPID_KEY',
] as const;

export type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

/**
 * Lee una variable obligatoria y lanza error descriptivo si no está definida.
 */
function readVar(name: RequiredEnvVar): string {
  const value = import.meta.env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `[BookCompass] Falta la variable de entorno obligatoria: ${name}. ` +
        'Crea un archivo .env.local a partir de .env.example y completa las credenciales de Firebase.',
    );
  }
  return value;
}

/**
 * Construye la configuración de Firebase validando todas las variables.
 *
 * @throws Error si falta alguna variable `VITE_FIREBASE_*`.
 */
export function readFirebaseEnv(): FirebaseEnvConfig {
  return {
    apiKey: readVar('VITE_FIREBASE_API_KEY'),
    authDomain: readVar('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: readVar('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: readVar('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: readVar('VITE_FIREBASE_APP_ID'),
    vapidKey: readVar('VITE_FIREBASE_VAPID_KEY'),
  };
}
