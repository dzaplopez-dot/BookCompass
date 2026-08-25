/**
 * Inicialización única (singleton perezoso) de los servicios de Firebase.
 *
 * Las instancias se crean bajo demanda mediante funciones proveedoras, lo que:
 * - evita tocar el SDK al importar módulos (mejor para pruebas),
 * - permite inyectar estos proveedores en los servicios (DIP).
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import {
  getMessaging,
  isSupported as isMessagingSupported,
  type Messaging,
} from 'firebase/messaging';
import { readFirebaseEnv } from './env';

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

/** Devuelve la instancia única de la aplicación Firebase (la crea si no existe). */
export function getAppInstance(): FirebaseApp {
  appInstance ??= getApps().length > 0 ? getApp() : initializeApp(readFirebaseEnv());
  return appInstance;
}

/** Devuelve la instancia única de Authentication. */
export function getAuthInstance(): Auth {
  authInstance ??= getAuth(getAppInstance());
  return authInstance;
}

/** Devuelve la instancia única de Firestore. */
export function getDbInstance(): Firestore {
  dbInstance ??= getFirestore(getAppInstance());
  return dbInstance;
}

/**
 * Devuelve la instancia de Cloud Messaging, o `null` si el navegador
 * no soporta mensajería push (la comprobación es asíncrona por diseño del SDK).
 */
export async function getMessagingInstance(): Promise<Messaging | null> {
  if (!(await isMessagingSupported())) {
    return null;
  }
  return getMessaging(getAppInstance());
}
