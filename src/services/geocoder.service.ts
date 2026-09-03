/**
 * Servicio de geocodificación inversa para Book Compass.
 *
 * Responsabilidad única: convertir coordenadas (lat, lng) en el nombre de la
 * ciudad/región en español usando el servicio público de Nominatim
 * (OpenStreetMap). Reutiliza el {@link RateLimiter} con una instancia propia
 * para respetar la política de uso de Nominatim (máx. 1 petición/segundo).
 *
 * Uso: importa el singleton `geocoderService`.
 */
import { AppError, normalizeError } from '../utils/errors';
import { RateLimiter } from './rate-limiter';

/** Endpoint de geocodificación inversa de Nominatim (OpenStreetMap). */
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

/**
 * Identificador de la aplicación para la cabecera `User-Agent` (requisito de
 * la política de uso de Nominatim: identificarse para poder contactarnos).
 */
const APP_USER_AGENT = 'BookCompassPWA/0.1 (app de descubrimiento literario)';

/**
 * Cola dedicada con ~1 petición/segundo, según la política de Nominatim.
 * Al usar una instancia propia no estorba a la cola de Internet Archive.
 */
const nominatimRateLimiter = new RateLimiter(1_100);

/** Resultado normalizado de una geocodificación inversa. */
export interface ReverseGeocodeResult {
  /** Nombre de la ciudad o asentamiento principal, o `null` si no se pudo. */
  city: string | null;
  /** Nombre de la región/estado/provincia, o `null` si no consta. */
  region: string | null;
  /** Nombre del país, o `null` si no consta. */
  country: string | null;
}

/**
 * Nombres de ciudad por definir. Devuelve la cadena legible más específica
 * para la búsqueda de libros: prefiere ciudad, luego región, luego país.
 */
function toDisplayName(result: ReverseGeocodeResult): string {
  return result.city ?? result.region ?? result.country ?? '';
}

/** Servicio de geocodificación inversa de Book Compass. */
export class GeocoderService {
  /**
   * Convierte unas coordenadas en el nombre de la ciudad/región en español.
   *
   * @param lat Latitud de la posición del usuario.
   * @param lng Longitud de la posición del usuario.
   * @returns El nombre legible más específico (ciudad > región > país).
   * @throws AppError si la petición falla o la respuesta no es válida.
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const coords = { lat, lng };
      this.assertValidCoordinates(coords);
      const result = await nominatimRateLimiter.enqueue(() =>
        this.fetchReverseGeocode(coords.lat, coords.lng),
      );
      const displayName = toDisplayName(result).trim();
      if (displayName.length === 0) {
        throw new AppError(
          'geocoder/no-result',
          'No se pudo determinar la ciudad desde tu ubicación.',
        );
      }
      return displayName;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /** Valida que las coordenadas sean finitas y acotadas. */
  private assertValidCoordinates(coords: { lat: number; lng: number }): void {
    const { lat, lng } = coords;
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw new AppError('geocoder/invalid-coords', 'Las coordenadas no son válidas.');
    }
  }

  /** Ejecuta la petición de reverse geocoding contra Nominatim. */
  private async fetchReverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    const endpoint = `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es&zoom=9`;

    let response: Response;
    try {
      response = await fetch(endpoint, { headers: { 'User-Agent': APP_USER_AGENT } });
    } catch {
      throw new AppError(
        'app/network-error',
        'Error de red al obtener tu ubicación. Comprueba tu conexión.',
      );
    }

    if (response.status === 429) {
      throw new AppError(
        'geocoder/too-many-requests',
        'Demasiadas peticiones de ubicación. Inténtalo de nuevo más tarde.',
      );
    }
    if (response.status >= 500) {
      throw new AppError(
        'geocoder/unavailable',
        'El servicio de ubicación no está disponible en este momento.',
      );
    }
    if (!response.ok) {
      throw new AppError(
        'geocoder/unexpected',
        `Error al obtener la ubicación (código ${response.status}).`,
      );
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new AppError('geocoder/unavailable', 'La respuesta de ubicación no es válida.');
    }

    const data = json as Record<string, unknown>;
    const address = (data.address as Record<string, unknown> | undefined) ?? {};

    const city =
      (typeof address.city === 'string' ? address.city : null) ??
      (typeof address.town === 'string' ? address.town : null) ??
      (typeof address.village === 'string' ? address.village : null) ??
      (typeof address.municipality === 'string' ? address.municipality : null);

    const region =
      (typeof address.state === 'string' ? address.state : null) ??
      (typeof address.province === 'string' ? address.province : null) ??
      (typeof address.region === 'string' ? address.region : null);

    const country = typeof address.country === 'string' ? address.country : null;

    return { city, region, country };
  }
}

/** Instancia única del servicio de geocodificación inversa. */
export const geocoderService = new GeocoderService();
