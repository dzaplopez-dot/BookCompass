/**
 * Tipos puros del dominio de Internet Archive Books API para Book Compass.
 *
 * Este módulo NO depende de ningún SDK: solo modela la respuesta cruda
 * de la API pública y la transforma a un formato de aplicación simplificado.
 *
 * Endpoints utilizados:
 * - Búsqueda: https://archive.org/advancedsearch.php
 * - Portadas: https://archive.org/services/img/{identifier}
 */

/**
 * Documento crudo tal como lo devuelve la API de Internet Archive en
 * `advancedsearch.php`. Se mapea internamente a {@link BookSummary}.
 */
export interface ArchiveSearchDoc {
  identifier: string;
  title?: string;
  creator?: string | string[];
  date?: string;
  /** Campo para detectar resultados vacíos. */
  [field: string]: unknown;
}

/** Respuesta cruda del endpoint `advancedsearch.php`. */
export interface ArchiveSearchResponse {
  responseHeader: {
    status: number;
    QTime: number;
    params: Record<string, unknown>;
  };
  response: {
    numFound: number;
    start: number;
    docs: ArchiveSearchDoc[];
  };
}

/** Resumen de un libro normalizado para la aplicación. */
export interface BookSummary {
  /** Identificador único del ítem en Internet Archive (ej. `bwb_7KV-351-228`). */
  id: string;
  title: string;
  /** Lista de autor/as; vacía si la API no proporciona ninguno. */
  authors: string[];
  /** Año de la primera publicación; `null` si desconocido. */
  firstPublishYear: number | null;
  /** URL de la portada o `null` si no hay portada disponible. */
  coverUrl: string | null;
}

/**
 * Resultado paginado de una búsqueda de libros.
 */
export interface SearchResult {
  /** Total de resultados encontrados en Internet Archive. */
  total: number;
  /** Número de página actual (0-indexed). */
  page: number;
  /** Libros del lote actual. */
  results: BookSummary[];
}

/**
 * Convierte un documento crudo de Internet Archive en un {@link BookSummary}.
 *
 * @param doc Documento crudo del array `docs` de la respuesta.
 */
export function mapArchiveDoc(doc: ArchiveSearchDoc): BookSummary {
  const id = doc.identifier ?? '';
  const coverUrl = id ? `https://archive.org/services/img/${id}` : null;

  // creator puede ser string o array de strings
  let authors: string[] = [];
  if (Array.isArray(doc.creator)) {
    authors = doc.creator.filter(Boolean);
  } else if (typeof doc.creator === 'string' && doc.creator.length > 0) {
    authors = [doc.creator];
  }

  // date viene como string ISO (ej. "1972-01-01T00:00:00Z") o solo año
  let firstPublishYear: number | null = null;
  if (typeof doc.date === 'string') {
    const year = parseInt(doc.date.slice(0, 4), 10);
    if (!Number.isNaN(year) && year > 0) {
      firstPublishYear = year;
    }
  }

  return {
    id,
    title: doc.title ?? 'Sin título',
    authors,
    firstPublishYear,
    coverUrl,
  };
}
