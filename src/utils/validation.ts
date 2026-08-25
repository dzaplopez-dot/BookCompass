/**
 * Validadores puros para los formularios de autenticación.
 *
 * Funciones sin dependencias de React ni del DOM: totalmente testeables
 * y reutilizables desde cualquier página.
 */

/** Patrón de correo electrónico simple y pragmático (usuario@dominio.tld). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Longitud mínima exigida por Firebase Authentication. */
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Comprueba si un correo electrónico tiene formato válido.
 *
 * @param email Correo a validar (se recorta antes de evaluar).
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/**
 * Comprueba si una contraseña cumple el mínimo de caracteres.
 *
 * @param password Contraseña a validar.
 */
export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

/**
 * Comprueba si dos contraseñas coinciden exactamente (usada en el registro).
 */
export function passwordsMatch(password: string, confirmation: string): boolean {
  return password === confirmation;
}
