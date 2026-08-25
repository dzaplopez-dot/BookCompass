/**
 * Provider global de autenticación de Book Compass.
 *
 * Responsabilidades (SRP):
 * - Mantener el estado de sesión sincronizado con Firebase (`onAuthStateChanged`).
 * - Orquestar login/registro/logout/recuperación delegando en `auth.service`.
 * - Sincronizar el perfil del usuario con Firestore (`users/{uid}`) y registrar
 *   la actividad en `analytics.service`.
 *
 * El contexto se consume mediante el hook `useAuth()` (`hooks/useAuth.ts`).
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { analyticsService } from '../services/analytics.service';
import { authService } from '../services/auth.service';
import { firestoreService } from '../services/firestore.service';
import type {
  AppUser,
  AuthContextValue,
  LoginCredentials,
  RegisterData,
  UserProfile,
} from '../types';
import { normalizeError } from '../utils/errors';
import { AuthContext } from './auth-context';

/**
 * Crea o actualiza el perfil del usuario tras un inicio de sesión/registro:
 * hace upsert del documento, estampa `lastLoginAt` y devuelve el perfil fresco.
 */
async function syncUserProfile(appUser: AppUser): Promise<UserProfile> {
  const now = Date.now();
  await firestoreService.ensureUserProfile(appUser);
  await firestoreService.update('users', appUser.uid, { lastLoginAt: now });

  const profile = await firestoreService.getUserProfile(appUser.uid);
  return profile ?? { ...appUser, createdAt: now, updatedAt: now, lastLoginAt: now };
}

/** Props del provider; la aplicación vive dentro de `children`. */
export interface AuthProviderProps {
  children: ReactNode;
}

/** Componente provider que envuelve la aplicación. */
export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Suscripción al estado de sesión: resuelve la carga inicial y reacciona
  // a cambios externos (logout desde otra pestaña, expiración, etc.).
  useEffect(() => {
    let cancelled = false;

    const unsubscribe = authService.observeAuthChanges((nextUser) => {
      if (cancelled) return;
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      void firestoreService
        .getUserProfile(nextUser.uid)
        .then((storedProfile) => {
          if (!cancelled) setProfile(storedProfile);
        })
        .catch(() => {
          if (!cancelled) setProfile(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  /** Ejecuta una acción de autenticación gestionando error y analítica. */
  const runAuthAction = useCallback(
    async (action: () => Promise<AppUser>, eventName: string, params?: Record<string, unknown>) => {
      setError(null);
      try {
        const appUser = await action();
        const syncedProfile = await syncUserProfile(appUser);
        setUser(appUser);
        setProfile(syncedProfile);
        analyticsService.track(eventName, params);
      } catch (caught) {
        setError(normalizeError(caught).message);
        throw caught;
      }
    },
    [],
  );

  const login = useCallback(
    (credentials: LoginCredentials) =>
      runAuthAction(
        () => authService.signInWithEmail(credentials.email, credentials.password),
        'login',
        {
          method: 'password',
        },
      ),
    [runAuthAction],
  );

  const loginWithGoogle = useCallback(
    () => runAuthAction(() => authService.signInWithGoogle(), 'login', { method: 'google' }),
    [runAuthAction],
  );

  const register = useCallback(
    (data: RegisterData) =>
      runAuthAction(
        () => authService.signUpWithEmail(data.email, data.password, data.displayName),
        'register',
        undefined,
      ),
    [runAuthAction],
  );

  const logout = useCallback(async () => {
    try {
      await authService.signOut();
      analyticsService.track('logout');
    } catch (caught) {
      setError(normalizeError(caught).message);
      throw caught;
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await authService.resetPassword(email);
      analyticsService.track('password_reset_requested');
    } catch (caught) {
      setError(normalizeError(caught).message);
      throw caught;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      error,
      isAuthenticated: user !== null,
      login,
      loginWithGoogle,
      register,
      logout,
      resetPassword,
      clearError,
    }),
    [
      user,
      profile,
      loading,
      error,
      login,
      loginWithGoogle,
      register,
      logout,
      resetPassword,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
