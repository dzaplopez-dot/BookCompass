/**
 * Tipos del dominio de favoritos de Book Compass.
 */
import type { FavoriteBook } from './index';

/** Estado y acciones expuestos por el contexto de favoritos. */
export interface FavoritesContextValue {
  /** Lista actual de libros favoritos del usuario. */
  favorites: FavoriteBook[];
  /** `true` mientras se cargan los favoritos del usuario. */
  loading: boolean;
  /** Comprueba si un libro está en favoritos. */
  isFavorite(identifier: string): boolean;
  /** Guarda un libro como favorito. */
  addFavorite(book: Omit<FavoriteBook, 'addedAt'>): Promise<void>;
  /** Elimina un libro de los favoritos. */
  removeFavorite(identifier: string): Promise<void>;
}
