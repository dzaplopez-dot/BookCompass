/**
 * Instancia compartida del contexto de favoritos.
 *
 * Vive en su propio módulo `.ts` para que tanto `FavoritesContext.tsx`
 * (provider) como `hooks/useFavorites.ts` (consumidor) importen la misma
 * instancia sin mezclar componentes con valores no-componente.
 */
import { createContext } from 'react';
import type { FavoritesContextValue } from '../types/favorites.types';

/** Contexto de React con el estado y las acciones de favoritos. */
export const FavoritesContext = createContext<FavoritesContextValue | null>(null);
