/**
 * Instancia compartida del contexto de autenticación.
 *
 * Vive en su propio módulo `.ts` para que tanto `AuthContext.tsx` (provider)
 * como `hooks/useAuth.ts` (consumidor) importen la misma instancia sin
 * mezclar componentes con valores no-componente en un mismo archivo.
 */
import { createContext } from 'react';
import type { AuthContextValue } from '../types/auth.types';

/** Contexto de React con el estado y las acciones de autenticación. */
export const AuthContext = createContext<AuthContextValue | null>(null);
