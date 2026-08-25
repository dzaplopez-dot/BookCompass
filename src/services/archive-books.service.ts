/**
 * Servicio de búsqueda de libros contra la Internet Archive Books API.
 *
 * Responsabilidades (SRP):
 * - Búsqueda por título/autor con paginación.
 * - Caché en memoria con TTL para evitar peticiones repetidas.
 * - Reintentos ante errores 429 (con Retry-After) y 5xx/red (backoff exponencial).
 * - Rate-limit global mediante {@link rateLimiter}.
 *
 * La UI consume exclusivamente este servicio; no hay puertos ni adaptadores.
 *
 * Endpoints:
 * - Búsqueda: https://archive.org/advancedsearch.php
 * - Portadas: https://archive.org/services/img/{identifier}
 */
import type { ArchiveSearchResponse, SearchResult } from '../types/archive-books.types';
import { mapArchiveDoc } from '../types/archive-books.types';
import { AppError } from '../utils/errors';
import { rateLimiter } from './rate-limiter';

/** Endpoint base de búsqueda de Internet Archive. */
const BASE_URL = 'https://archive.org/advancedsearch.php';

/** Campos solicitados a la API (mínimos para nuestro mapeo). */
const SEARCH_FIELDS = 'identifier,title,creator,date';

/** Filtro para obtener solo libros (textos). */
const MEDIATYPE_FILTER = 'mediatype:texts';

/** Número máximo de resultados por página. */
const PAGE_SIZE = 12;

/** Máximo de reintentos ante errores transitorios. */
const MAX_RETRIES = 3;

/** Retardo base para backoff exponencial (en ms). */
const BASE_RETRY_DELAY_MS = 1_000;

/** Tiempo de vida de la caché por defecto (5 minutos en ms). */
const DEFAULT_TTL_MS = 5 * 60 * 1_000;

/** TTL reducido para búsquedas vacías (1 minuto). */
const EMPTY_RESULT_TTL_MS = 1 * 60 * 1_000;

/** Número máximo de entradas en la caché (FIFO). */
const MAX_CACHE_ENTRIES = 50;

/** Entrada de caché con marca de expiración. */
interface CacheEntry {
  data: SearchResult;
  expiresAt: number;
}

/**
 * Clave de caché normalizada: query minúscula sin espacios extra + página.
 */
function cacheKey(query: string, page: number): string {
  return `${query.trim().toLowerCase()}::${page}`;
}

/**
 * Servicio de búsqueda de libros con rate-limit, caché y reintentos.
 */
export class ArchiveBooksService {
  private cache = new Map<string, CacheEntry>();
  private ttlMs: number;

  /**
   * @param ttlMs Tiempo de vida de la caché en milisegundos (por defecto 5 min).
   */
  constructor(ttlMs = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  /**
   * Busca libros por título o autor con paginación.
   *
   * @param query Término de búsqueda libre.
   * @param page  Página deseada (0-indexed; por defecto 0).
   * @returns Resultado paginado con libros normalizados.
   * @throws AppError si la petición falla tras los reintentos.
   */
  async searchBooks(query: string, page = 0): Promise<SearchResult> {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      return { total: 0, page: 0, results: [] };
    }

    const key = cacheKey(trimmed, page);
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const result = await this.fetchWithRetries(trimmed, page);

    const ttl = result.results.length === 0 ? EMPTY_RESULT_TTL_MS : this.ttlMs;
    this.store(key, { data: result, expiresAt: Date.now() + ttl });

    return result;
  }

  /**
   * Realiza la petición a Internet Archive con reintentos inteligentes.
   *
   * - 429: respeta `Retry-After` (cap 10 s), hasta 3 intentos.
   * - 5xx / errores de red: backoff exponencial (1 s → 2 s → 4 s).
   */
  private async fetchWithRetries(query: string, page: number): Promise<SearchResult> {
    const start = page * PAGE_SIZE;
    // Búsqueda por título y autor, filtrada solo a libros
    const searchQuery = `(${query}) AND ${MEDIATYPE_FILTER}`;
    const url = `${BASE_URL}?q=${encodeURIComponent(searchQuery)}&fl[]=${SEARCH_FIELDS.split(',').join('&fl[]=')}&output=json&rows=${PAGE_SIZE}&start=${start}`;

    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await rateLimiter.enqueue(() => this.executeRequest(url));
      } catch (error) {
        lastError = error;

        if (error instanceof AppError) {
          if (error.code === 'archive/too-many-requests') {
            // 429: espera el tiempo indicado por Retry-After antes de reintentar.
            const waitMs = parseRetryAfter(error) ?? BASE_RETRY_DELAY_MS * 2 ** attempt;
            await sleep(waitMs);
            continue;
          }
          // Errores de red/5xx: backoff exponencial.
          if (error.code === 'archive/unavailable' || error.code === 'app/network-error') {
            await sleep(BASE_RETRY_DELAY_MS * 2 ** attempt);
            continue;
          }
        }

        // Errores no recuperables: no reintentar.
        throw error;
      }
    }

    // Se agotaron los reintentos.
    throw lastError instanceof AppError
      ? lastError
      : new AppError('app/unknown', 'Ha ocurrido un error inesperado. Inténtalo de nuevo.');
  }

  /** Ejecuta una petición HTTP individual contra la API. */
  private async executeRequest(url: string): Promise<SearchResult> {
    let response: Response;

    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
    } catch {
      throw new AppError('app/network-error', 'Error de red. Comprueba tu conexión a internet.');
    }

    // 429 Too Many Requests: traduce Retry-After a AppError para que el caller lo gestione.
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      throw new AppError(
        'archive/too-many-requests',
        'Demasiadas peticiones. Inténtalo de nuevo más tarde.',
        retryAfter,
      );
    }

    // 5xx Server Error.
    if (response.status >= 500) {
      throw new AppError(
        'archive/unavailable',
        'El servicio de Internet Archive no está disponible en este momento.',
      );
    }

    // Cualquier otro status inesperado (4xx que no sea 429).
    if (!response.ok) {
      throw new AppError(
        'archive/unexpected',
        `Error inesperado de Internet Archive (código ${response.status}).`,
      );
    }

    // Parseo seguro.
    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new AppError(
        'archive/unavailable',
        'La respuesta de Internet Archive no tiene un formato válido.',
      );
    }

    const raw = json as ArchiveSearchResponse;
    const docs = Array.isArray(raw.response?.docs) ? raw.response.docs : [];

    return {
      total: typeof raw.response?.numFound === 'number' ? raw.response.numFound : 0,
      page:
        typeof raw.response?.start === 'number' ? Math.floor(raw.response.start / PAGE_SIZE) : 0,
      results: docs.map(mapArchiveDoc),
    };
  }

  /** Almacena una entrada en caché y expulsa la más antigua si se supera el límite. */
  private store(key: string, entry: CacheEntry): void {
    this.cache.set(key, entry);

    if (this.cache.size > MAX_CACHE_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
  }
}

/**
 * Extrae el tiempo de espera de un AppError lanzado por 429.
 * El valor de Retry-After se guarda en `cause` al lanzar el error.
 */
function parseRetryAfter(error: AppError): number | null {
  const raw = error.cause;
  if (typeof raw === 'string') {
    const seconds = Number(raw);
    if (!Number.isNaN(seconds) && seconds > 0) {
      return Math.min(seconds * 1_000, 10_000); // Cap: 10 s.
    }
  }
  return null;
}

/** Espera asíncrona el número de milisegundos indicado. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Instancia única del servicio de Internet Archive Books para toda la aplicación. */
export const archiveBooksService = new ArchiveBooksService();
