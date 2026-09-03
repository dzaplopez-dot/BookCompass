/**
 * Provider global de géneros literarios favoritos del usuario.
 *
 * Responsabilidades (SRP):
 * - Cargar la selección de géneros del usuario al iniciar sesión, usando
 *   localStorage como caché instantánea y Firestore como fuente de verdad.
 * - Exponer `saveGenres()` para persistir (Firestore + localStorage) y
 *   actualizar el estado local.
 *
 * El contexto se consume mediante el hook `useGenres()` (`hooks/useGenres.ts`).
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
import { genresService } from '../services/genres.service';
import { isValidGenreCount, type GenresContextValue } from '../types/auth.types';
import { GenresContext } from './genres-context';

/** Props del provider; la aplicación vive dentro de `children`. */
export interface GenresProviderProps {
  children: ReactNode;
}

/** Componente provider que envuelve la aplicación. */
export function GenresProvider({ children }: GenresProviderProps): ReactElement {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [genres, setGenres] = useState<string[]>(() => genresService.readLocal());
  const [loading, setLoading] = useState(false);

  // Carga la selección de géneros al autenticarse o cambiar de usuario.
  useEffect(() => {
    if (uid === null) {
      return;
    }

    let cancelled = false;

    async function loadGenres(ownerId: string): Promise<void> {
      setLoading(true);
      try {
        const saved = await genresService.getGenres(ownerId);
        if (!cancelled && saved) setGenres(saved);
      } catch {
        // Sin selección guardada aún: se conserva lo que haya en localStorage.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadGenres(uid);

    return () => {
      cancelled = true;
    };
  }, [uid]);

  /** Guarda la selección de géneros y actualiza el estado local. */
  const saveGenres = useCallback(
    async (selected: string[]): Promise<void> => {
      if (uid === null) {
        throw new Error('No hay sesión activa.');
      }
      await genresService.saveGenres(uid, selected);
      setGenres(selected);
    },
    [uid],
  );

  const value = useMemo<GenresContextValue>(
    () => ({
      genres,
      loading,
      isValid: isValidGenreCount(genres),
      saveGenres,
    }),
    [genres, loading, saveGenres],
  );

  return <GenresContext.Provider value={value}>{children}</GenresContext.Provider>;
}
