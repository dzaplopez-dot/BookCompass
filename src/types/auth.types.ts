/**
 * Tipos del dominio de autenticación de Book Compass.
 */
import type { AppUser, UserProfile } from './index';

/** Preferencias de usuario almacenadas junto a su perfil en Firestore. */
export interface UserPreferences {
  /** Si el usuario acepta recibir notificaciones push. */
  notificationsEnabled: boolean;
  /** Materias o géneros literarios favoritos (para recomendaciones). */
  favoriteGenres: string[];
}

/** Credenciales para iniciar sesión con correo y contraseña. */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Datos necesarios para registrar una cuenta nueva. */
export interface RegisterData {
  /** Nombre visible opcional; si falta se usa la parte local del email. */
  displayName?: string;
  email: string;
  password: string;
}

/** Estado y acciones expuestos por {@link AuthProvider} vía `useAuth()`. */
export interface AuthContextValue {
  /** Usuario autenticado actual o `null` si no hay sesión. */
  user: AppUser | null;
  /** Perfil completo del usuario desde Firestore o `null` si aún no cargó. */
  profile: UserProfile | null;
  /** `true` mientras se resuelve el estado inicial de sesión. */
  loading: boolean;
  /** Último error amigable producido por una acción de autenticación. */
  error: string | null;
  /** Atajo derivado: `user !== null`. */
  isAuthenticated: boolean;
  /** Inicia sesión con correo y contraseña. */
  login(credentials: LoginCredentials): Promise<void>;
  /** Inicia sesión con Google mediante popup. */
  loginWithGoogle(): Promise<void>;
  /** Registra una cuenta nueva y crea su perfil en Firestore. */
  register(data: RegisterData): Promise<void>;
  /** Cierra la sesión actual. */
  logout(): Promise<void>;
  /** Envía el correo de recuperación de contraseña. */
  resetPassword(email: string): Promise<void>;
  /** Descarta el error mostrado actualmente. */
  clearError(): void;
}
