/**
 * Instancia compartida del contexto de géneros literarios.
 *
 * Vive en su propio módulo `.ts` para que tanto `GenresContext.tsx`
 * (provider) como `hooks/useGenres.ts` (consumidor) importen la misma
 * instancia sin mezclar componentes con valores no-componente.
 */
import { createContext } from 'react';
import type { GenresContextValue } from '../types/auth.types';

/** Contexto de React con el estado y las acciones de géneros del usuario. */
export const GenresContext = createContext<GenresContextValue | null>(null);
