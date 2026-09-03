/**
 * Página «Libros cerca de ti».
 *
 * Le pide al usuario su permiso de ubicación, traduce las coordenadas al
 * nombre de la ciudad (geocodificación inversa con Nominatim) y busca en
 * Internet Archive libros relacionados con esa ciudad.
 *
 * Flujo de estados:
 * 1. Sin permiso: invitación con botón «Compartir mi ubicación».
 * 2. Obteniendo ubicación/ciudad: carga.
 * 3. Sin permiso concedido / error: mensaje con opción a reintentar.
 * 4. Resultados: grid de BookCard con paginación.
 */
import { useCallback, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { BookCard } from '../components/books/BookCard';
import { Spinner } from '../components/common/Spinner';
import { archiveBooksService } from '../services/archive-books.service';
import { geocoderService } from '../services/geocoder.service';
import type { BookSummary } from '../types/archive-books.types';
import { normalizeError } from '../utils/errors';

/** Resultado normalizado de la ubicación obtenida por el usuario. */
type LocationResult = { name: string; lat: number; lng: number };

/**
 * Solicita la posición actual del usuario como promesa.
 * Rechaza si el usuario deniega el permiso o si falla la geolocalización.
 */
function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('La geolocalización no está disponible en este navegador.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 30_000,
    });
  });
}

/** Página privada de libros cerca de la ubicación del usuario. */
export default function NearbyPage(): ReactElement {
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [resolving, setResolving] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [results, setResults] = useState<BookSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  /** Obtiene la ubicación, la ciudad y desencadena la búsqueda de libros. */
  const handleShareLocation = useCallback(async () => {
    setResolving(true);
    setLocationError(null);

    let position: GeolocationPosition;
    try {
      position = await getCurrentPosition();
    } catch {
      setResolving(false);
      setLocationError(
        'No pudimos acceder a tu ubicación. Compruébalo y vuelve a intentarlo, o revisa los permisos del navegador.',
      );
      return;
    }

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    let cityName: string;
    try {
      cityName = await geocoderService.reverseGeocode(lat, lng);
    } catch (caught) {
      setResolving(false);
      setLocationError(normalizeError(caught).message);
      return;
    }

    const locationResult: LocationResult = { name: cityName, lat, lng };
    setLocation(locationResult);
    setResolving(false);
    setSearching(true);
    setSearchError(null);

    try {
      const response = await archiveBooksService.searchBooksByCity(cityName, 0);
      setResults(response.results);
      setTotal(response.total);
      setPage(0);
    } catch (caught) {
      setSearchError(normalizeError(caught).message);
      setResults([]);
      setTotal(0);
    } finally {
      setSearching(false);
    }
  }, []);

  /** Carga la siguiente página de resultados de la ciudad. */
  const handleLoadMore = useCallback(async () => {
    if (!location) {
      return;
    }
    const nextPage = page + 1;
    setSearching(true);
    setSearchError(null);
    try {
      const response = await archiveBooksService.searchBooksByCity(location.name, nextPage);
      setResults((previous) => [...previous, ...response.results]);
      setTotal(response.total);
      setPage(nextPage);
    } catch (caught) {
      setSearchError(normalizeError(caught).message);
    } finally {
      setSearching(false);
    }
  }, [location, page]);

  const hasMore = (page + 1) * 12 < total;

  return (
    <div className="min-h-svh bg-paper">
      {/* ─── Cabecera ───────────────────────────────────────────────────── */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="font-display text-xl font-bold">🧭 Book Compass</span>
          <div className="flex items-center gap-2">
            {location ? (
              <Link
                to="/map"
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium transition hover:bg-stone-50"
              >
                🗺️ Ver en el mapa
              </Link>
            ) : null}
            <Link
              to="/home"
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium transition hover:bg-stone-50"
            >
              ← Inicio
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">Libros cerca de ti</h1>
        <p className="mt-1 text-sm text-stone-500">
          Comparte tu ubicación para descubrir libros relacionados con tu ciudad.
        </p>

        {/* ─── Estado: sin permiso aún ──────────────────────────────────── */}
        {!location && !resolving ? (
          <section className="mt-8 flex flex-col items-center rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
            <span className="text-4xl">📍</span>
            <h2 className="mt-4 font-display text-xl font-bold">¿Dónde estás?</h2>
            <p className="mt-2 max-w-md text-sm text-stone-500">
              Para mostrarte los libros cerca de tu ubicación, necesitamos saber tu ciudad. Solo la
              usamos para buscar y nunca la guardamos.
            </p>
            {locationError ? (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {locationError}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void handleShareLocation()}
              className="mt-6 rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Compartir mi ubicación
            </button>
          </section>
        ) : null}

        {/* ─── Estado: obteniendo ubicación ─────────────────────────────── */}
        {resolving ? (
          <div className="mt-12 flex justify-center py-8">
            <Spinner size="lg" label="Obteniendo tu ubicación…" />
          </div>
        ) : null}

        {/* ─── Resultados por ciudad ────────────────────────────────────── */}
        {location ? (
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold tracking-tight">{location.name}</h2>
              <span className="text-sm text-stone-500">
                {searching
                  ? null
                  : `${total.toLocaleString('es-CO')} resultado${total === 1 ? '' : 's'}`}
              </span>
            </div>

            {/* Buscando la primera página */}
            {searching && results.length === 0 ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" label="Buscando libros…" />
              </div>
            ) : null}

            {/* Error de búsqueda */}
            {searchError ? (
              <div
                role="alert"
                className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {searchError}
              </div>
            ) : null}

            {/* Vacío */}
            {!searching && !searchError && results.length === 0 ? (
              <p className="py-12 text-center text-sm text-stone-400">
                No encontramos libros relacionados con «{location.name}». Prueba en otra ubicación o
                más tarde.
              </p>
            ) : null}

            {/* Grid de resultados */}
            {results.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {results.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : null}

            {/* Cargar más */}
            {hasMore ? (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => void handleLoadMore()}
                  disabled={searching}
                  className="flex items-center gap-2 rounded-lg border border-stone-300 px-6 py-2.5 text-sm font-medium transition hover:bg-stone-50 disabled:opacity-60"
                >
                  {searching ? <Spinner size="sm" /> : null}
                  {searching ? 'Cargando…' : 'Cargar más'}
                </button>
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
