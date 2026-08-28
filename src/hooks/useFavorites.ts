/**
 * Hook de acceso al contexto de favoritos.
 *
 * Lanza un error descriptivo si se usa fuera de `<FavoritesProvider>`, lo que
 * detecta fallos de composición en tiempo de desarrollo y no en runtime.
 */
import { useContext } from 'react';
import { FavoritesContext } from '../context/favorites-context';
import type { FavoritesContextValue } from '../types/favorites.types';

/** Devuelve el estado y las acciones de favoritos de la app. */
export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites debe usarse dentro de <FavoritesProvider>');
  }
  return context;
}
