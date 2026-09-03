/**
 * Servicio de géneros literarios favoritos del usuario.
 *
 * Responsabilidad única: guardar la selección de géneros del usuario
 * (mínimo 3, máximo 5) en dos sitios:
 * - **localStorage** (clave `bookcompass_genres`): disponible al instante,
 *   tolerante a entornos sin storage.
 * - **Firestore** (`users/{uid}.preferences.favoriteGenres`): persistencia
 *   del perfil, bajo la regla ya activa del dueño (sin reglas nuevas).
 *
 * Uso: importa el singleton `genresService`.
 */
import { firestoreService } from './firestore.service';
import type { UserProfile } from '../types';
import { normalizeError } from '../utils/errors';

/** Clave bajo la que se persisten los géneros en localStorage. */
const STORAGE_KEY = 'bookcompass_genres';

/** Servicio de géneros literarios de Book Compass. */
export class GenresService {
  /**
   * Obtiene los géneros de un usuario desde Firestore (fuente de verdad).
   * Devuelve `null` si el perfil no tiene selección guardada.
   *
   * @param uid Identificador del usuario autenticado.
   */
  async getGenres(uid: string): Promise<string[] | null> {
    try {
      const profile = await firestoreService.getUserProfile(uid);
      const genres = profile?.preferences?.favoriteGenres;
      return Array.isArray(genres) && genres.length > 0 ? genres : null;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Guarda la selección de géneros en Firestore (perfil) y en localStorage.
   *
   * Conserva el resto de preferencias del perfil (`notificationsEnabled`…)
   * para no pisarlas.
   *
   * @param uid     Identificador del usuario autenticado.
   * @param genres  Selección de identificadores de género (3 a 5).
   */
  async saveGenres(uid: string, genres: string[]): Promise<void> {
    try {
      const profile = (await firestoreService.getUserProfile(uid)) as UserProfile | null;
      const currentPreferences = profile?.preferences ?? { notificationsEnabled: false };
      await firestoreService.update<UserProfile>('users', uid, {
        updatedAt: Date.now(),
        preferences: { ...currentPreferences, favoriteGenres: genres },
      });
      this.persistLocal(genres);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Lee los géneros guardados en localStorage (cache local). Devuelve un
   * array vacío si no hay selección o si el storage no está disponible.
   */
  readLocal(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }

  /** Persiste los géneros en localStorage (tolerante a fallos de storage). */
  private persistLocal(genres: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(genres));
    } catch {
      // localStorage puede no estar disponible (modo privado, cuota…):
      // Firestore mantiene la fuente de verdad, así que se ignora el fallo.
    }
  }
}

/** Instancia única del servicio de géneros para toda la aplicación. */
export const genresService = new GenresService();
