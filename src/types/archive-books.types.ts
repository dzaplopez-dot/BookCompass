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
import { LITERARY_GENRES } from './auth.types';

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
  /** URL de la portada en JPEG (fallback universal) o `null` si no hay portada. */
  coverUrl: string | null;
  /** URL opcional de la portada en WebP para navegadores que no soportan AVIF. */
  coverUrlWebp?: string | null;
  /** URL opcional de la portada en AVIF (máxima compresión). */
  coverUrlAvif?: string | null;
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

/** Metadatos crudos del ítem tal como los devuelve `metadata/{identifier}`. */
export interface ArchiveMetadata {
  identifier?: string;
  title?: string;
  creator?: string | string[];
  date?: string;
  publisher?: string | string[];
  description?: string;
  subject?: string | string[];
  language?: string | string[];
  imagecount?: number;
  mediatype?: string;
  /** `true` si el acceso está restringido (préstamo) y `false` o ausente si es libre. */
  'access-restricted-item'?: string;
  'identifier-access'?: string;
  /** Relaciona un ítem con su obra/edición en Open Library. */
  openlibrary_work?: string;
  [field: string]: unknown;
}

/** Detalle completo de un libro para la página de información. */
export interface BookDetail {
  /** Identificador del ítem en Internet Archive. */
  id: string;
  title: string;
  authors: string[];
  firstPublishYear: number | null;
  coverUrl: string | null;
  coverUrlWebp: string | null;
  coverUrlAvif: string | null;
  /** Editorial o editoriales; vacía si no consta. */
  publishers: string[];
  /** Descripción/sinopsis; `null` si no hay. */
  description: string | null;
  /** Temas o géneros; vacío si no constan. */
  subjects: string[];
  /** Código(s) de idioma; vacío si no consta. */
  languages: string[];
  /** Número de páginas; `null` si no consta. */
  pageCount: number | null;
  /** URL pública para leer en línea, o `null` si no hay versión digital accesible. */
  readingUrl: string | null;
}

/**
 * Construye las URLs de portada para un identificador de Internet Archive.
 *
 * Centraliza la construcción de URLs para que sea fácil modificarlas en el
 * futuro (p. ej. apuntar a un CDN/proxy propio que sirva AVIF y WebP) sin
 * tocar el resto del mapeo.
 *
 * Hoy Internet Archive solo expone las portadas en JPEG (`services/img`),
 * por lo que `webp` y `avif` quedan como `null` a la espera de un backend.
 *
 * @param identifier Identificador del ítem en Internet Archive.
 */
export function getCoverUrls(identifier: string): {
  coverUrl: string | null;
  coverUrlWebp: string | null;
  coverUrlAvif: string | null;
} {
  if (!identifier) {
    return { coverUrl: null, coverUrlWebp: null, coverUrlAvif: null };
  }
  // JPEG: fallback universal actual. WebP/AVIF: pendiente de CDN/proxy propio.
  return {
    coverUrl: `https://archive.org/services/img/${identifier}`,
    coverUrlWebp: null,
    coverUrlAvif: null,
  };
}

/**
 * Convierte un documento crudo de Internet Archive en un {@link BookSummary}.
 *
 * @param doc Documento crudo del array `docs` de la respuesta.
 */
export function mapArchiveDoc(doc: ArchiveSearchDoc): BookSummary {
  const id = doc.identifier ?? '';
  const { coverUrl, coverUrlWebp, coverUrlAvif } = getCoverUrls(id);

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
    coverUrlWebp,
    coverUrlAvif,
  };
}

/**
 * Extrae un array de strings a partir de un valor que puede ser string,
 * array de strings o estar ausente.
 */
function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }
  return [];
}

/**
 * Convierte los metadatos crudos de Internet Archive en un {@link BookDetail}.
 *
 * @param metadata Objeto `metadata` de la respuesta de `metadata/{identifier}`.
 */
export function mapArchiveDetail(metadata: ArchiveMetadata): BookDetail {
  const id = metadata.identifier ?? '';
  const coverUrls = getCoverUrls(id);

  // date: "1977" o "1977-01-01T00:00:00Z" → año.
  let firstPublishYear: number | null = null;
  if (typeof metadata.date === 'string') {
    const year = parseInt(metadata.date.slice(0, 4), 10);
    if (!Number.isNaN(year) && year > 0) {
      firstPublishYear = year;
    }
  }

  // Archivo es privado/apartado si access-restricted-item === 'true'.
  const isRestricted = metadata['access-restricted-item'] === 'true';
  const identifierAccess = metadata['identifier-access'];
  const readingUrl =
    !isRestricted && typeof identifierAccess === 'string' ? identifierAccess : null;

  return {
    id,
    title: metadata.title ?? 'Sin título',
    authors: toStringArray(metadata.creator),
    firstPublishYear,
    coverUrl: coverUrls.coverUrl,
    coverUrlWebp: coverUrls.coverUrlWebp,
    coverUrlAvif: coverUrls.coverUrlAvif,
    publishers: toStringArray(metadata.publisher),
    description: toDescription(metadata.description),
    subjects: toStringArray(metadata.subject),
    languages: toLanguages(metadata.language),
    pageCount: toPageCount(metadata.imagecount),
    readingUrl,
  };
}

/**
 * Mapa de códigos de idioma ISO (639-1/639-2) que devuelve Internet Archive
 * a los nombres mostrados en español. Los códigos no reconocidos se
 * conservan tal cual.
 */
const LANGUAGE_NAMES: Record<string, string> = {
  spa: 'Español',
  es: 'Español',
  eng: 'Inglés',
  en: 'Inglés',
  fra: 'Francés',
  fr: 'Francés',
  deu: 'Alemán',
  de: 'Alemán',
  ita: 'Italiano',
  it: 'Italiano',
  por: 'Portugués',
  pt: 'Portugués',
  rus: 'Ruso',
  ru: 'Ruso',
  jpn: 'Japonés',
  ja: 'Japonés',
  zho: 'Chino',
  zh: 'Chino',
  ara: 'Árabe',
  ar: 'Árabe',
  lat: 'Latín',
  grc: 'Griego antiguo',
  el: 'Griego',
  heb: 'Hebreo',
  he: 'Hebreo',
  pol: 'Polaco',
  pl: 'Polaco',
  cat: 'Catalán',
  ca: 'Catalán',
  nld: 'Neerlandés',
  nl: 'Neerlandés',
  swe: 'Sueco',
  sv: 'Sueco',
  und: 'Sin determinar',
};

/**
 * Normaliza los idiomas de Internet Archive (códigos ISO) a nombres en español.
 */
function toLanguages(raw: unknown): string[] {
  return toStringArray(raw)
    .map((code) => LANGUAGE_NAMES[code] ?? code)
    .filter((name, index, array) => array.indexOf(name) === index);
}

/**
 * Patrón que detecta descripciones que solo son ficha física de colación
 * (p. ej. "190, [1] s. : 20 cm", "527 p. : 21 cm" o "xii, 123 p. ; 24 cm"),
 * que no aportan una sinopsis legible al usuario.
 */
const COLLATION_PATTERN =
  /^(\.{2,}|(?:[ivxlcdm]+|[0-9])[\d\s.,\-—]*\s*\[?\d*\]?\s*(?:s\.|p\.|págs?\.|pp\.|v\.|vol\.))/i;

/**
 * Normaliza la sinopsis de Internet Archive a un único string.
 *
 * La API puede devolverla como texto plano o como un array de fragmentos;
 * además algunos ítems solo incluyen la ficha física (p. ej.
 * "190, [1] s. : 20 cm"). Se descartan las coincidencias puras de ficha
 * física y se devuelve `null` si no queda nada legible que mostrar.
 */
function toDescription(raw: unknown): string | null {
  const parts = toStringArray(raw);
  if (parts.length === 0) {
    return null;
  }
  const joined = parts.join(' ').trim();
  if (joined.length === 0 || COLLATION_PATTERN.test(joined)) {
    return null;
  }
  return joined;
}

/**
 * Normaliza el número de páginas, que Internet Archive entrega como número
 * o como cadena (p. ej. "182"). Devuelve `null` si no es un entero positivo.
 */
function toPageCount(raw: unknown): number | null {
  let value: number | null = null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    value = raw;
  } else if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10);
    value = Number.isNaN(parsed) ? null : parsed;
  }
  return value !== null && value > 0 ? Math.floor(value) : null;
}

/**
 * Traduce una lista de identificadores de género (`LITERARY_GENRES[].id`)
 * a los keywords de Internet Archive que los representan.
 */
export function toGenreKeywords(genreIds: string[]): string[] {
  const keywords = new Set<string>();
  for (const genreId of genreIds) {
    const genre = LITERARY_GENRES.find((candidate) => candidate.id === genreId);
    if (genre) {
      for (const keyword of genre.keywords) {
        keywords.add(keyword);
      }
    }
  }
  return [...keywords];
}

/**
 * Construye una cláusula `subject:(...)` de Internet Archive a partir de
 * los géneros seleccionados, lista para combinar con el filtro de libros.
 *
 * Ejemplo: `subject:("Fiction" OR "Novela" OR "Mystery")`.
 */
export function toGenreQuery(genreIds: string[]): string {
  const keywords = toGenreKeywords(genreIds);
  if (keywords.length === 0) {
    return '';
  }
  const quoted = keywords.map((keyword) => `"${keyword.replace(/"/g, '')}"`).join(' OR ');
  return `subject:(${quoted})`;
}
