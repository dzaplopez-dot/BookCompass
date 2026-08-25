/**
 * Servicio de base de datos con Cloud Firestore.
 *
 * Responsabilidad única: acceso a datos persistentes. Expone CRUD genérico
 * tipado (usando restricciones nativas del SDK en `list`) y la gestión del
 * documento de perfil de usuario (`users/{uid}`).
 *
 * Uso: importa el singleton `firestoreService`.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  type QueryConstraint,
} from 'firebase/firestore';
import { getDbInstance } from '../config/firebase';
import type { AppUser, UserProfile, WithId } from '../types';
import { normalizeError } from '../utils/errors';

/** Colección reservada para los perfiles de usuario. */
const USERS_COLLECTION = 'users';

/** Servicio de persistencia de Book Compass. */
export class FirestoreService {
  /** Crea un documento y devuelve su identificador autogenerado. */
  async create<T extends object>(collectionName: string, data: T): Promise<string> {
    try {
      const reference = await addDoc(collection(getDbInstance(), collectionName), data);
      return reference.id;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /** Actualiza parcialmente un documento existente. */
  async update<T extends object>(
    collectionName: string,
    documentId: string,
    patch: Partial<T>,
  ): Promise<void> {
    try {
      const reference = doc(getDbInstance(), collectionName, documentId);
      await setDoc(reference, patch, { merge: true });
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /** Elimina un documento. */
  async remove(collectionName: string, documentId: string): Promise<void> {
    try {
      await deleteDoc(doc(getDbInstance(), collectionName, documentId));
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /** Obtiene un documento por identificador, o `null` si no existe. */
  async getById<T extends object>(
    collectionName: string,
    documentId: string,
  ): Promise<(T & WithId) | null> {
    try {
      const snapshot = await getDoc(doc(getDbInstance(), collectionName, documentId));
      if (!snapshot.exists()) {
        return null;
      }
      return { ...(snapshot.data() as T), id: snapshot.id };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Lista documentos aplicando restricciones nativas del SDK.
   *
   * @example
   * const recientes = await firestoreService.list<Book>('books', [
   *   where('uid', '==', user.uid),
   *   orderBy('createdAt', 'desc'),
   *   limit(20),
   * ]);
   */
  async list<T extends object>(
    collectionName: string,
    constraints: readonly QueryConstraint[] = [],
  ): Promise<Array<T & WithId>> {
    try {
      const reference = query(collection(getDbInstance(), collectionName), ...constraints);
      const snapshot = await getDocs(reference);
      return snapshot.docs.map((documentSnapshot) => ({
        ...(documentSnapshot.data() as T),
        id: documentSnapshot.id,
      }));
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Crea o actualiza (upsert) el perfil del usuario en `users/{uid}`,
   * conservando `createdAt` si ya existía y refrescando `updatedAt`.
   */
  async ensureUserProfile(user: AppUser): Promise<UserProfile> {
    try {
      const existing = await this.getUserProfile(user.uid);
      const now = Date.now();

      const profile: UserProfile = existing
        ? { ...existing, ...user, updatedAt: now }
        : { ...user, createdAt: now, updatedAt: now };

      await setDoc(doc(getDbInstance(), USERS_COLLECTION, user.uid), profile, { merge: true });
      return profile;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /** Devuelve el perfil del usuario o `null` si aún no existe. */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snapshot = await getDoc(doc(getDbInstance(), USERS_COLLECTION, uid));
      if (!snapshot.exists()) {
        return null;
      }
      return snapshot.data() as UserProfile;
    } catch (error) {
      throw normalizeError(error);
    }
  }
}

/** Instancia única del servicio de base de datos para toda la aplicación. */
export const firestoreService = new FirestoreService();
