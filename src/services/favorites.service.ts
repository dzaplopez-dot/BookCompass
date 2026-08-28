/**
 * Servicio de favoritos del usuario.
 *
 * Responsabilidad única: gestionar la lista de libros favoritos de un usuario
 * en Firestore, bajo la subcolección `users/{uid}/favorites/{identifier}`.
 *
 * Uso: importa el singleton `favoritesService`.
 */
import { getDoc, setDoc, deleteDoc, doc, collection } from 'firebase/firestore';
import { getDbInstance } from '../config/firebase';
import type { FavoriteBook, WithId } from '../types';
import { normalizeError } from '../utils/errors';
import { firestoreService } from './firestore.service';

/** Nombre de la subcolección de favoritos por usuario. */
const FAVORITES_COLLECTION = 'favorites';

/**
 * Devuelve la referencia a la colección `users/{uid}/favorites`.
 */
function favoritesCollection(uid: string) {
  return collection(getDbInstance(), 'users', uid, FAVORITES_COLLECTION);
}

/** Servicio de favoritos de Book Compass. */
export class FavoritesService {
  /**
   * Obtiene todos los favoritos de un usuario.
   *
   * @param uid Identificador del usuario autenticado.
   */
  async getFavorites(uid: string): Promise<Array<FavoriteBook & WithId>> {
    try {
      return await firestoreService.list<FavoriteBook>(favoritesCollection(uid).path);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Comprueba si un libro está guardado en favoritos.
   *
   * @param uid Identificador del usuario.
   * @param identifier Identificador del libro en Internet Archive.
   */
  async isFavorite(uid: string, identifier: string): Promise<boolean> {
    try {
      const snapshot = await getDoc(doc(favoritesCollection(uid), identifier));
      return snapshot.exists();
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Guarda un libro como favorito del usuario (idempotente).
   *
   * @param uid  Identificador del usuario.
   * @param book Datos del libro a guardar (sin `addedAt`, se rellena aquí).
   */
  async addFavorite(uid: string, book: Omit<FavoriteBook, 'addedAt'>): Promise<void> {
    try {
      const payload: FavoriteBook = { ...book, addedAt: Date.now() };
      await setDoc(doc(favoritesCollection(uid), book.id), payload);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Elimina un libro de los favoritos del usuario (idempotente).
   *
   * @param uid        Identificador del usuario.
   * @param identifier Identificador del libro en Internet Archive.
   */
  async removeFavorite(uid: string, identifier: string): Promise<void> {
    try {
      await deleteDoc(doc(favoritesCollection(uid), identifier));
    } catch (error) {
      throw normalizeError(error);
    }
  }
}

/** Instancia única del servicio de favoritos para toda la aplicación. */
export const favoritesService = new FavoritesService();
