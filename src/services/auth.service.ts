/**
 * Servicio de autenticación con Firebase Authentication.
 *
 * Responsabilidad única: identidad y sesión (correo/contraseña y Google).
 * Los errores del SDK se normalizan a `AppError` con mensajes en español.
 *
 * Uso: importa el singleton `authService`.
 */
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getAuthInstance } from '../config/firebase';
import type { AppUser, Unsubscribe } from '../types';
import { normalizeError } from '../utils/errors';

/** Convierte un usuario del SDK al tipo de dominio. */
function toDomain(user: User): AppUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

/** Servicio de autenticación de Book Compass. */
export class AuthService {
  /**
   * Registra una cuenta nueva con correo y contraseña.
   *
   * @param email Correo electrónico.
   * @param password Contraseña (mínimo 6 caracteres según Firebase).
   * @param displayName Nombre visible opcional; se asigna al perfil de Firebase.
   */
  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<AppUser> {
    try {
      const credential = await createUserWithEmailAndPassword(getAuthInstance(), email, password);
      if (displayName && displayName.trim() !== '') {
        await updateProfile(credential.user, { displayName: displayName.trim() });
      }
      return toDomain(credential.user);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /** Inicia sesión con correo y contraseña. */
  async signInWithEmail(email: string, password: string): Promise<AppUser> {
    try {
      const credential = await signInWithEmailAndPassword(getAuthInstance(), email, password);
      return toDomain(credential.user);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Inicia sesión con Google mediante ventana emergente.
   *
   * Nota: el fallback con redirect para navegadores que bloquean popups
   * se añadirá en la fase de UI.
   */
  async signInWithGoogle(): Promise<AppUser> {
    try {
      const credential = await signInWithPopup(getAuthInstance(), new GoogleAuthProvider());
      return toDomain(credential.user);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Envía el correo de recuperación de contraseña.
   *
   * Nota: con la protección anti-enumeración de Firebase activada, este método
   * responde con éxito aunque el correo no esté registrado (por privacidad).
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(getAuthInstance(), email);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /** Cierra la sesión actual. */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(getAuthInstance());
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /** Usuario autenticado actual o `null` si no hay sesión abierta. */
  getCurrentUser(): AppUser | null {
    const current = getAuthInstance().currentUser;
    return current ? toDomain(current) : null;
  }

  /**
   * Observa cambios de sesión en tiempo real.
   *
   * @returns Función para cancelar la suscripción.
   */
  observeAuthChanges(listener: (user: AppUser | null) => void): Unsubscribe {
    return onAuthStateChanged(getAuthInstance(), (user) => listener(user ? toDomain(user) : null));
  }
}

/** Instancia única del servicio de autenticación para toda la aplicación. */
export const authService = new AuthService();
