/**
 * Indicador de carga reutilizable.
 *
 * Se usa en botones (tamaño `sm`), pantallas de verificación de sesión
 * (`fullScreen`) y cualquier estado de espera intermedio.
 */

/** Tamaños disponibles del spinner. */
export type SpinnerSize = 'sm' | 'md' | 'lg';

/** Mapa de clases Tailwind por tamaño. */
const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
};

/** Props del spinner. */
export interface SpinnerProps {
  /** Tamaño visual del indicador. Por defecto `md`. */
  size?: SpinnerSize;
  /**
   * Texto accesible anunciado por lectores de pantalla. Si se proporciona
   * junto a `fullScreen`, se muestra también de forma visible.
   */
  label?: string;
  /** Modo pantalla completa centrado verticalmente (usado por las rutas). */
  fullScreen?: boolean;
}

/** Anillo giratorio con estilos de la marca. */
export function Spinner({ size = 'md', label, fullScreen = false }: SpinnerProps) {
  const ring = (
    <span
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Cargando'}
      className={`inline-block animate-spin rounded-full border-solid border-primary-container border-t-transparent ${SIZE_CLASSES[size]}`}
    />
  );

  if (!fullScreen) {
    return ring;
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background">
      {ring}
      {label ? <p className="text-sm text-on-surface-variant">{label}</p> : null}
    </div>
  );
}
