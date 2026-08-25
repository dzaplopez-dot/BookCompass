/**
 * Hook de acceso al contexto de autenticación.
 *
 * Lanza un error descriptivo si se usa fuera de `<AuthProvider>`, lo que
 * detecta fallos de composición en tiempo de desarrollo y no en runtime.
 */
import { useContext } from 'react';
import { AuthContext } from '../context/auth-context';
import type { AuthContextValue } from '../types/auth.types';

/** Devuelve el estado y las acciones de autenticación de la app. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return context;
}
