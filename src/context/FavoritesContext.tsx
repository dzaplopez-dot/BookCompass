/**
 * Provider global de favoritos de Book Compass.
 *
 * Responsabilidades (SRP):
 * - Mantener la lista de favoritos del usuario sincronizada con Firestore
 *   (`users/{uid}/favorites`), recargándola al iniciar sesión o cambiar de usuario.
 * - Exponer acciones de guardar/eliminar que actualizan el estado local.
 *
 * El contexto se consume mediante el hook `useFavorites()` (`hooks/useFavorites.ts`).
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import { favoritesService } from '../services/favorites.service';
import type { FavoriteBook, FavoritesContextValue } from '../types';
import { FavoritesContext } from './favorites-context';

/** Props del provider; la aplicación vive dentro de `children`. */
export interface FavoritesProviderProps {
  children: ReactNode;
}

/** Componente provider que envuelve la aplicación. */
export function FavoritesProvider({ children }: FavoritesProviderProps): ReactElement {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [favorites, setFavorites] = useState<FavoriteBook[]>([]);
  const [loading, setLoading] = useState(false);

  // Carga los favoritos al autenticarse o cambiar de usuario.
  useEffect(() => {
    if (uid === null) {
      return;
    }

    let cancelled = false;

    async function loadFavorites(ownerId: string): Promise<void> {
      setLoading(true);
      try {
        const items = await favoritesService.getFavorites(ownerId);
        if (!cancelled) setFavorites(items);
      } catch {
        if (!cancelled) setFavorites([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadFavorites(uid);

    return () => {
      cancelled = true;
    };
  }, [uid]);

  /** Comprueba si un libro está en favoritos. */
  const isFavorite = useCallback(
    (identifier: string): boolean => favorites.some((favorite) => favorite.id === identifier),
    [favorites],
  );

  /** Guarda un libro como favorito y actualiza el estado local. */
  const addFavorite = useCallback(
    async (book: Omit<FavoriteBook, 'addedAt'>): Promise<void> => {
      if (uid === null) {
        throw new Error('No hay sesión activa.');
      }
      await favoritesService.addFavorite(uid, book);
      setFavorites((previous) => [...previous, { ...book, addedAt: Date.now() }]);
    },
    [uid],
  );

  /** Elimina un libro de favoritos y actualiza el estado local. */
  const removeFavorite = useCallback(
    async (identifier: string): Promise<void> => {
      if (uid === null) {
        throw new Error('No hay sesión activa.');
      }
      await favoritesService.removeFavorite(uid, identifier);
      setFavorites((previous) => previous.filter((favorite) => favorite.id !== identifier));
    },
    [uid],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, loading, isFavorite, addFavorite, removeFavorite }),
    [favorites, loading, isFavorite, addFavorite, removeFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
