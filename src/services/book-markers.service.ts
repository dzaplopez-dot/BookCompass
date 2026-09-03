/**
 * Servicio de marcadores en el mapa de Book Compass.
 *
 * Responsabilidad única: gestionar los marcadores de libros en la colección
 * compartida `book_markers` de Firestore. A diferencia de los favoritos
 * (privados por usuario), los marcadores son visibles para todos los usuarios
 * autenticados, de modo que el mapa muestre la comunidad de lectores.
 *
 * Uso: importa el singleton `bookMarkersService`.
 */
import { deleteDoc, doc } from 'firebase/firestore';
import { getDbInstance } from '../config/firebase';
import type { BookMarker, WithId } from '../types';
import { normalizeError } from '../utils/errors';
import { firestoreService } from './firestore.service';

/** Nombre de la colección compartida de marcadores. */
const MARKERS_COLLECTION = 'book_markers';

/**
 * Devuelve la referencia al documento de un marcador.
 *
 * @param markerId Identificador del documento en `book_markers`.
 */
function markerDoc(markerId: string) {
  return doc(getDbInstance(), MARKERS_COLLECTION, markerId);
}

/**
 * Valida que las coordenadas del marcador sean números finitos y acotados.
 * Protege la escritura frente a valores corruptos o fuera de rango.
 */
function assertValidCoordinates(marker: Omit<BookMarker, 'createdBy' | 'createdAt'>): void {
  const { lat, lng } = marker;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Las coordenadas del marcador deben ser números válidos.');
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('Las coordenadas del marcador están fuera de rango.');
  }
}

/** Servicio de marcadores de Book Compass. */
export class BookMarkersService {
  /**
   * Obtiene todos los marcadores de la comunidad, sin paginar.
   *
   * El volumen esperado es modesto (marcadores de usuarios), por lo que una
   * sola lectura es suficiente para el mapa actual.
   */
  async getMarkers(): Promise<Array<BookMarker & WithId>> {
    try {
      return await firestoreService.list<BookMarker>(MARKERS_COLLECTION);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Crea un marcador en Firestore y devuelve su identificador autogenerado.
   *
   * @param marker Datos del marcador (sin `createdBy`/`createdAt`, se rellenan
   *               aquí salvo cuando se proveen para datos de demostración).
   */
  async addMarker(marker: Omit<BookMarker, 'createdAt'>, timestamp?: number): Promise<string> {
    try {
      assertValidCoordinates(marker);
      const payload: BookMarker = { ...marker, createdAt: timestamp ?? Date.now() };
      return await firestoreService.create<BookMarker>(MARKERS_COLLECTION, payload);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Elimina un marcador por su identificador.
   *
   * @param markerId Identificador del documento en `book_markers`.
   */
  async removeMarker(markerId: string): Promise<void> {
    try {
      await deleteDoc(markerDoc(markerId));
    } catch (error) {
      throw normalizeError(error);
    }
  }
}

/** Instancia única del servicio de marcadores para toda la aplicación. */
export const bookMarkersService = new BookMarkersService();
