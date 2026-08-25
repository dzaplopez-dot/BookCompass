/**
 * Guarda de rutas públicas (login/registro/recuperación).
 *
 * Si ya existe una sesión abierta redirige a `/home`, evitando que un usuario
 * autenticado vuelva a ver los formularios de autenticación.
 */
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

/** Props: contenido público a renderizar cuando NO haya sesión. */
export interface PublicRouteProps {
  children: ReactNode;
}

/** Envoltorio para rutas accesibles sin autenticación. */
export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
