/**
 * Hook de acceso al contexto de géneros literarios.
 *
 * Lanza un error descriptivo si se usa fuera de `<GenresProvider>`, lo que
 * detecta fallos de composición en tiempo de desarrollo y no en runtime.
 */
import { useContext } from 'react';
import { GenresContext } from '../context/genres-context';
import type { GenresContextValue } from '../types/auth.types';

/** Devuelve el estado y las acciones de géneros del usuario. */
export function useGenres(): GenresContextValue {
  const context = useContext(GenresContext);
  if (!context) {
    throw new Error('useGenres debe usarse dentro de <GenresProvider>');
  }
  return context;
}
