/**
 * Componente de imagen responsivo para portadas de libros.
 *
 * Usa el elemento `<picture>` de HTML5 para servir formatos modernos en
 * cascada (AVIF → WebP → JPEG), con fallback universal en JPEG para
 * navegadores antiguos. Incluye:
 * - Carga diferida (`loading="lazy"`).
 * - Descodificación asíncrona (`decoding="async"`).
 * - Dimensiones fijas (aspect-ratio 2/3) para evitar layout shift.
 *
 * Nota: hoy Internet Archive solo sirve las portadas en JPEG (180×273 px),
 * así que `coverUrlAvif`/`coverUrlWebp` llegan normalmente como `null`.
 * El componente queda preparado para cuando exista un CDN/proxy propio que
 * genere estas variantes sin cambiar la API del componente.
 */

/** URLs alternativas de una portada por formato. */
export interface BookCoverSources {
  /** URL de la portada en JPEG (fallback universal) o `null` si no hay portada. */
  jpeg: string | null;
  /** URL opcional en WebP, para navegadores que no soportan AVIF. */
  webp?: string | null;
  /** URL opcional en AVIF, formato de máxima compresión. */
  avif?: string | null;
  /** Texto alternativo de la imagen. */
  alt: string;
}

/** Props del componente. */
export interface BookCoverProps {
  sources: BookCoverSources;
}

/**
 * Renderiza la portada con `<picture>` o el placeholder si no hay imagen.
 *
 * Las dimensiones fijas `aspect-[2/3]` (ratio de libro estándar) con
 * `object-cover` garantizan que la imagen llene el recuadro sin deformarse
 * ni causar saltos de layout al cargar.
 */
export function BookCover({ sources }: BookCoverProps) {
  const { jpeg, webp, avif, alt } = sources;

  if (!jpeg) {
    return (
      <div className="flex aspect-[2/3] items-center justify-center bg-stone-100 text-stone-300">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-12 w-12">
          <path
            fill="currentColor"
            d="M12 2a10 10 0 0 0-6.88 17.23l.9-1.23A1.5 1.5 0 0 1 7.3 17h9.4a1.5 1.5 0 0 1 1.28.73l.9 1.22A10 10 0 0 0 12 2Zm-4 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
          />
        </svg>
      </div>
    );
  }

  return (
    <picture>
      {avif ? <source srcSet={avif} type="image/avif" /> : null}
      {webp ? <source srcSet={webp} type="image/webp" /> : null}
      <img
        src={jpeg}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="aspect-[2/3] w-full object-cover"
        width={180}
        height={273}
      />
    </picture>
  );
}
