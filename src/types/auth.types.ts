/**
 * Tipos del dominio de autenticación de Book Compass.
 */
import type { AppUser, UserProfile } from './index';

/** Mínimo de géneros que debe elegir el usuario. */
export const MIN_GENRES = 3;

/** Máximo de géneros que puede elegir el usuario. */
export const MAX_GENRES = 5;

/**
 * Un género literario ofertado en la cuadrícula de selección.
 *
 * `keywords` son los `subject` de Internet Archive (mayoritariamente en
 * inglés) con los que se filtra la búsqueda para ese género.
 */
export interface LiteraryGenre {
  /** Identificador estable del género (p. ej. `fiction`). */
  id: string;
  /** Nombre mostrado al usuario (p. ej. «Ficción»). */
  label: string;
  /** Descripción breve para la cuadrícula. */
  description: string;
  /** Subjects de Internet Archive con los que coincide el género. */
  keywords: string[];
}

/**
 * Catálogo de géneros literarios ofertados al usuario.
 */
export const LITERARY_GENRES: LiteraryGenre[] = [
  {
    id: 'fiction',
    label: 'Ficción',
    description: 'Novelas e historias inventadas',
    keywords: ['Fiction', 'Novela'],
  },
  {
    id: 'mystery',
    label: 'Misterio',
    description: 'Intrigas, suspenso y crímenes',
    keywords: ['Mystery', 'Misterio', 'Detective'],
  },
  {
    id: 'romance',
    label: 'Romance',
    description: 'Historias de amor y sentimientos',
    keywords: ['Romance', 'Love'],
  },
  {
    id: 'scifi',
    label: 'Ciencia Ficción',
    description: 'Futuros, tecnología y otros mundos',
    keywords: ['Science fiction', 'Ciencia ficción'],
  },
  {
    id: 'fantasy',
    label: 'Fantasía',
    description: 'Magia, mundos imaginarios y leyendas',
    keywords: ['Fantasy', 'Fantasía'],
  },
  {
    id: 'history',
    label: 'Historia',
    description: 'Pasado, biografías y hechos reales',
    keywords: ['History', 'Historical', 'Historia'],
  },
  {
    id: 'poetry',
    label: 'Poesía',
    description: 'Verso, rima y expresión lírica',
    keywords: ['Poetry', 'Poesía'],
  },
  {
    id: 'horror',
    label: 'Terror',
    description: 'Miedo, oscuridad y lo sobrenatural',
    keywords: ['Horror', 'Terror'],
  },
  {
    id: 'nonfiction',
    label: 'No-ficción',
    description: 'Ensayo, ciencia y conocimiento',
    keywords: ['Nonfiction', 'Non-fiction', 'Essays'],
  },
];

/**
 * Comprueba si una selección de géneros cumple la regla de negocio
 * (entre {@link MIN_GENRES} y {@link MAX_GENRES}).
 */
export function isValidGenreCount(genres: string[]): boolean {
  return genres.length >= MIN_GENRES && genres.length <= MAX_GENRES;
}

/** Preferencias de usuario almacenadas junto a su perfil en Firestore. */
export interface UserPreferences {
  /** Si el usuario acepta recibir notificaciones push. */
  notificationsEnabled: boolean;
  /** Materias o géneros literarios favoritos (para recomendaciones). */
  favoriteGenres: string[];
}

/** Estado y acciones expuestos por el contexto de géneros literarios. */
export interface GenresContextValue {
  /** Identificadores de género seleccionados por el usuario (p. ej. `fiction`). */
  genres: string[];
  /** `true` mientras se cargan los géneros del usuario. */
  loading: boolean;
  /** Comprueba si la selección actual cumple el mínimo (3) y el máximo (5). */
  isValid: boolean;
  /** Guarda la selección en Firestore y localStorage y actualiza el estado. */
  saveGenres(selected: string[]): Promise<void>;
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
  /** Actualiza los datos editables del perfil (nombre visible). */
  updateProfile(data: UpdateProfileData): Promise<void>;
  /** Descarta el error mostrado actualmente. */
  clearError(): void;
}

/** Datos editables del perfil del usuario. */
export interface UpdateProfileData {
  /** Nombre visible; se recorta y debe ser no vacío. */
  displayName: string;
}
