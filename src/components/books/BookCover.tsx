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
  /**
   * Carga prioritaria (LCP) para la página de detalle. Por defecto `false`
   * (carga diferida en listados).
   */
  eager?: boolean;
}

/**
 * Renderiza la portada con `<picture>` o el placeholder si no hay imagen.
 *
 * Las dimensiones fijas `aspect-[2/3]` (ratio de libro estándar) con
 * `object-cover` garantizan que la imagen llene el recuadro sin deformarse
 * ni causar saltos de layout al cargar. El contenedor padre limita el ancho
 * (≤240 px) para no ampliar la miniatura de 180 px de Internet Archive y
 * evitar el aspecto pixelado.
 */
export function BookCover({ sources, eager = false }: BookCoverProps) {
  const { jpeg, webp, avif, alt } = sources;

  if (!jpeg) {
    return (
      <div className="flex aspect-[2/3] items-center justify-center bg-surface-container-low text-outline">
        <span aria-hidden="true" className="material-symbols-outlined text-5xl">
          menu_book
        </span>
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
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : 'auto'}
        className="aspect-[2/3] h-auto w-full object-cover"
        width={180}
        height={273}
      />
    </picture>
  );
}
