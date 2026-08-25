/**
 * Guarda de rutas privadas: renderiza `children` solo si hay sesión abierta.
 *
 * - Mientras se resuelve la sesión inicial (`loading`) muestra un spinner
 *   a pantalla completa para evitar redirecciones falsas al montar la app.
 * - Si no hay usuario autenticado, redirige a `/login`.
 */
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Spinner } from './Spinner';
import { useAuth } from '../../hooks/useAuth';

/** Props: contenido protegido a renderizar cuando exista sesión. */
export interface PrivateRouteProps {
  children: ReactNode;
}

/** Envoltorio que protege rutas que requieren autenticación. */
export function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Spinner fullScreen label="Verificando tu sesión…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
