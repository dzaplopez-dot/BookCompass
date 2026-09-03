/**
 * Datos de demostración para el mapa de Book Compass.
 *
 * Son marcadores ficticios (libros reales de Internet Archive colocados en
 * ubicaciones de ejemplo) que se muestran junto a los creados por usuarios
 * para que el mapa no aparezca vacío al inicio.
 *
 * Las ubicaciones se generan relativas a un centro (por defecto una ciudad de
 * referencia o la geolocalización del usuario), de modo que los marcadores de
 * demostración aparezcan siempre cerca del centro del mapa.
 */
import type { DemoMarker } from '../types/book-marker.types';

/** Centro de referencia por defecto (Bogotá, Colombia). */
const FALLBACK_CENTER = { lat: 4.711, lng: -74.0721 };

/**
 * Desplazamientos (en grados) alrededor del centro para esparcir los
 * marcadores sin que se superpongan.
 */
const OFFSETS: ReadonlyArray<{ lat: number; lng: number }> = [
  { lat: 0.02, lng: 0.012 },
  { lat: -0.018, lng: -0.014 },
  { lat: 0.03, lng: -0.008 },
  { lat: -0.028, lng: 0.016 },
  { lat: 0.008, lng: -0.03 },
  { lat: -0.012, lng: 0.028 },
  { lat: 0.024, lng: 0.02 },
  { lat: -0.022, lng: -0.012 },
];

const COVER = (identifier: string): string => `https://archive.org/services/img/${identifier}`;

/** Datos base de los libros reales usados en la demostración. */
const DEMO_BOOKS: ReadonlyArray<{
  demoId: string;
  bookIdentifier: string;
  bookTitle: string;
  authors: string[];
  genreIds: string[];
}> = [
  {
    demoId: 'demo-romance-1',
    bookIdentifier: 'americanstar00jack',
    bookTitle: 'American Star: A Love Story',
    authors: ['Jackie Collins'],
    genreIds: ['romance'],
  },
  {
    demoId: 'demo-romance-2',
    bookIdentifier: 'choiceofangels00char',
    bookTitle: 'A Choice of Angels: A Love Story',
    authors: ['Harold Coyle'],
    genreIds: ['romance'],
  },
  {
    demoId: 'demo-scifi-1',
    bookIdentifier: 'bwb_S0-AIQ-987',
    bookTitle: 'The Far-Out People: A Science Fiction Anthology',
    authors: [],
    genreIds: ['scifi'],
  },
  {
    demoId: 'demo-scifi-2',
    bookIdentifier: 'bwb_S0-CEE-969',
    bookTitle: 'Bodyguard and Four Other Short Science Fiction Stories',
    authors: [],
    genreIds: ['scifi'],
  },
  {
    demoId: 'demo-poetry-1',
    bookIdentifier: 'scotlishpoetry0000unse',
    bookTitle: 'A Scottish Poetry Book',
    authors: [],
    genreIds: ['poetry'],
  },
  {
    demoId: 'demo-poetry-2',
    bookIdentifier: 'bwb_C0-AXA-514',
    bookTitle: 'Modern British Poetry',
    authors: [],
    genreIds: ['poetry'],
  },
  {
    demoId: 'demo-horror-1',
    bookIdentifier: '11greathorrorsto0000bett',
    bookTitle: '11 Great Horror Stories',
    authors: [],
    genreIds: ['horror'],
  },
  {
    demoId: 'demo-fiction-1',
    bookIdentifier: 'ficcionesdeborge0000fern',
    bookTitle: 'Ficciones de Borges: En las galerías del laberinto',
    authors: ['Antonio Fernández Ferrer'],
    genreIds: ['fiction'],
  },
];

/**
 * Construye los marcadores de demostración alrededor de un centro.
 *
 * @param center Coordenadas del centro del mapa; si se omite se usa
 *               {@link FALLBACK_CENTER} (Bogotá).
 */
export function buildDemoMarkers(center = FALLBACK_CENTER): DemoMarker[] {
  return DEMO_BOOKS.map((book, index) => {
    const offset = OFFSETS[index % OFFSETS.length];
    return {
      demo: true,
      demoId: book.demoId,
      bookIdentifier: book.bookIdentifier,
      bookTitle: book.bookTitle,
      authors: book.authors,
      coverUrl: COVER(book.bookIdentifier),
      genreIds: book.genreIds,
      lat: Number((center.lat + offset.lat).toFixed(5)),
      lng: Number((center.lng + offset.lng).toFixed(5)),
      createdBy: 'demo',
      createdAt: Date.now(),
    };
  });
}
