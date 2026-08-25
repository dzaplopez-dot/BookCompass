/**
 * Errores de dominio y normalización de errores provenientes de SDKs externos.
 * Funciones puras sin dependencias, totalmente testeables.
 */

/** Mensajes amigables (español) para códigos conocidos de Firebase Auth. */
const AUTH_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  'auth/email-already-in-use': 'El correo electrónico ya está registrado.',
  'auth/invalid-email': 'El correo electrónico no tiene un formato válido.',
  'auth/user-not-found': 'No existe una cuenta asociada a ese correo.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/invalid-credential': 'Credenciales incorrectas.',
  'auth/weak-password': 'La contraseña es demasiado débil (mínimo 6 caracteres).',
  'auth/too-many-requests': 'Demasiados intentos. Inténtalo de nuevo más tarde.',
  'auth/popup-closed-by-user': 'Se cerró la ventana de inicio de sesión.',
  'auth/popup-blocked': 'El navegador bloqueó la ventana emergente.',
  'auth/network-request-failed': 'Error de red. Comprueba tu conexión.',
};

/** Mensaje por defecto cuando no hay traducción disponible. */
const FALLBACK_MESSAGE = 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';

/**
 * Error de dominio de Book Compass con código estable para manejo en UI.
 */
export class AppError extends Error {
  /** Código estable del error (p. ej. `auth/wrong-password`). */
  readonly code: string;

  constructor(code: string, message: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

/**
 * Extrae el código de un error arbitrario si lo expone (los errores de
 * Firebase tienen la forma `{ code: 'auth/...' }`).
 */
function extractCode(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    return (error as { code: string }).code;
  }
  return 'app/unknown';
}

/**
 * Normaliza cualquier valor capturado en un `AppError` con mensaje en español.
 * Si el valor ya es un `AppError`, se devuelve tal cual (transparencia).
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  const code = extractCode(error);
  const message = AUTH_ERROR_MESSAGES[code] ?? FALLBACK_MESSAGE;
  return new AppError(code, message, error);
}
