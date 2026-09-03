/**
 * Tipos del dominio de marcadores en el mapa de Book Compass.
 *
 * Un marcador es un libro "colocado" por un usuario en una ubicación
 * (coordenadas), típicamente una librería o biblioteca donde se encuentra
 * disponible. Los marcadores se guardan en la colección `book_markers` de
 * Firestore y se muestran combinados con la geolocalización del usuario.
 */
import { LITERARY_GENRES } from './auth.types';

/**
 * Marcador de libro en el mapa.
 *
 * `genreIds` se denormaliza en el documento para poder colorear el marcador
 * en el mapa sin realizar consultas adicionales a la API.
 */
export interface BookMarker {
  /** Identificador del ítem en Internet Archive (al que enlaza el detalle). */
  bookIdentifier: string;
  /** Título del libro, denormalizado para el popup del mapa. */
  bookTitle: string;
  /** Autor/es del libro, denormalizados para el popup del mapa. */
  authors: string[];
  /** URL de la portada (JPEG) o `null` si no hay. */
  coverUrl: string | null;
  /** Latitud de la ubicación donde está el marcador. */
  lat: number;
  /** Longitud de la ubicación donde está el marcador. */
  lng: number;
  /** Identificadores de género del creador (para colorear el marcador). */
  genreIds: string[];
  /** Identificador del usuario que creó el marcador. */
  createdBy: string;
  /** Marca de tiempo de creación (ms desde epoch). */
  createdAt: number;
}

/**
 * Mapa de color (hex) por identificador de género usado para pintar los
 * marcadores del mapa. Los géneros desconocidos caen al color ámbar de marca.
 */
const GENRE_COLORS: Record<string, string> = {
  fiction: '#6366f1', // índigo
  mystery: '#0ea5e9', // celeste
  romance: '#ec4899', // rosa
  scifi: '#8b5cf6', // violeta
  fantasy: '#a855f7', // púrpura
  history: '#f59e0b', // ámbar oscuro
  poetry: '#10b981', // esmeralda
  horror: '#ef4444', // rojo
  nonfiction: '#14b8a6', // teal
};

/** Color ambarino de marca usado como fallback y para el usuario. */
export const MARKER_FALLBACK_COLOR = '#d97706';

/**
 * Devuelve el color (hex) con el que se pinta un marcador según sus géneros.
 *
 * Usa el primer género reconocido de la lista; si ninguno coincide o la
 * lista está vacía, aplica el color de marca {@link MARKER_FALLBACK_COLOR}.
 *
 * @param genreIds Identificadores de género del marcador.
 */
export function getMarkerColor(genreIds: string[]): string {
  for (const genreId of genreIds) {
    const color = GENRE_COLORS[genreId];
    if (color) {
      return color;
    }
  }
  return MARKER_FALLBACK_COLOR;
}

/**
 * Marcador de demostración para sembrar el mapa de inicio.
 *
 * Extiende {@link BookMarker} con un identificador estable para que los
 * marcadores de prueba se puedan distinguir de los creados por usuarios.
 */
export interface DemoMarker extends BookMarker {
  /** `true` indica que es un marcador de demostración del front. */
  demo: true;
  /** Identificador estable del marcador de demostración. */
  demoId: string;
}

/** Lista de identificadores de género disponibles (para el seed). */
export const GENRE_IDS = LITERARY_GENRES.map((genre) => genre.id);
