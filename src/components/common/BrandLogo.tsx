/**
 * Logotipo de Book Compass (framework Stitch «Premium Literary Discovery»).
 *
 * Imagen local versionada en `public/logo-compass.png` (512×512, descargada
 * de Stitch para no depender de enlaces temporales ni romper el modo
 * offline de la PWA). Se muestra con `object-contain` como en las vistas
 * `login_espa_ol`/`splash_screen` del framework.
 */
import type { ReactElement } from 'react';

/** Tamaños disponibles del logotipo. */
export type BrandLogoSize = 'sm' | 'md' | 'lg';

/** Props del logotipo. */
interface BrandLogoProps {
  /** Tamaño del logotipo (por defecto `md`, igual que el login de Stitch). */
  size?: BrandLogoSize;
  /** Clases extra (p. ej. márgenes del contexto). */
  className?: string;
}

/** Clases de tamaño por variante. */
const SIZE_CLASSES: Record<BrandLogoSize, string> = {
  sm: 'h-12 w-12',
  md: 'h-20 w-20',
  lg: 'h-28 w-28',
};

/** Imagen del logotipo con carga diferida. */
export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps): ReactElement {
  const extra = className.trim();
  return (
    <img
      src="/logo-compass.png"
      alt="Book Compass"
      loading="lazy"
      decoding="async"
      className={`object-contain ${SIZE_CLASSES[size]}${extra ? ` ${extra}` : ''}`}
    />
  );
}
