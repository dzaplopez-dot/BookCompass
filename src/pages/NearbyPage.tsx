/**
 * Página «Libros cerca de ti».
 *
 * Le pide al usuario su permiso de ubicación, traduce las coordenadas al
 * nombre de la ciudad (geocodificación inversa con Nominatim) y busca en
 * Internet Archive libros relacionados con ese lugar.
 *
 * Si la ciudad no tiene libros asociados, amplía sola la búsqueda a la
 * región y luego al país, y lo indica en pantalla.
 *
 * Flujo de estados:
 * 1. Sin permiso: invitación con botón «Compartir mi ubicación».
 * 2. Obteniendo ubicación/ciudad: carga.
 * 3. Sin permiso concedido / error: mensaje con opción a reintentar.
 * 4. Resultados: lista de BookCard con paginación.
 */
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { BookCard } from '../components/books/BookCard';
import { BottomNav } from '../components/common/BottomNav';
import { Spinner } from '../components/common/Spinner';
import { MapView, type MapMarker } from '../components/map/MapView';
import { archiveBooksService } from '../services/archive-books.service';
import { bookMarkersService } from '../services/book-markers.service';
import { geocoderService } from '../services/geocoder.service';
import type { BookSummary } from '../types/archive-books.types';
import type { BookMarker, WithId } from '../types';
import { normalizeError } from '../utils/errors';

/** Resultado normalizado de la ubicación obtenida por el usuario. */
interface LocationResult {
  /** Ámbito con el que se buscaron los libros (ciudad, región o país). */
  name: string;
  /** Lugar más específico detectado (normalmente la ciudad). */
  detected: string;
  /** `true` cuando se amplió la búsqueda porque la ciudad no tenía libros. */
  broadened: boolean;
  lat: number;
  lng: number;
}

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
    // Nota: los navegadores solo permiten geolocalización en contextos seguros
    // (localhost o HTTPS). En red local por http://IP:5173 el móvil la bloquea.
    if (!window.isSecureContext) {
      reject(
        new Error(
          'La geolocalización está bloqueada por usar una conexión no segura. Abre la app por localhost o con HTTPS.',
        ),
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 30_000,
    });
  });
}

/**
 * Mensaje amigable según el motivo del fallo de geolocalización.
 * @param reason Error original del navegador o de la comprobación previa.
 */
function toLocationErrorMessage(reason: unknown): string {
  if (reason instanceof GeolocationPositionError) {
    if (reason.code === 1) {
      return 'Permiso de ubicación denegado. Actívalo en el navegador (icono del candado en la barra de dirección) y vuelve a intentarlo.';
    }
    if (reason.code === 2) {
      return 'No pudimos determinar tu posición. Revisa el GPS o la conexión y vuelve a intentarlo.';
    }
    if (reason.code === 3) {
      return 'La obtención de tu ubicación tardó demasiado. Vuelve a intentarlo.';
    }
  }
  if (reason instanceof Error && reason.message.length > 0) {
    return reason.message;
  }
  return 'No pudimos acceder a tu ubicación. Compruébalo y vuelve a intentarlo, o revisa los permisos del navegador.';
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

  // Posición del usuario: se fija apenas el GPS responde, para que el mapa
  // con el punto «Estás aquí» aparezca sin esperar la búsqueda de libros.
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  // Marcadores de la comunidad para el mapa integrado (demos + reales).
  const [realMarkers, setRealMarkers] = useState<Array<BookMarker & WithId>>([]);
  const [markersNotice, setMarkersNotice] = useState<string | null>(null);
  // Libro resaltado al pulsar su marcador en el mapa.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Carga los marcadores de la comunidad al montar (degrada a demos si falla).
  useEffect(() => {
    let cancelled = false;
    async function loadMarkers(): Promise<void> {
      try {
        const real = await bookMarkersService.getMarkers();
        if (!cancelled) setRealMarkers(real);
      } catch (caught) {
        if (!cancelled) {
          setRealMarkers([]);
          setMarkersNotice(normalizeError(caught).message);
        }
      }
    }
    void loadMarkers();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Centro del mapa: la posición del GPS (disponible antes que la ciudad). */
  const mapCenter = useMemo(
    () => (position ? { lat: position.lat, lng: position.lng } : null),
    [position],
  );

  /** Marcadores del mapa integrado: solo la comunidad (sin datos ficticios). */
  const mapMarkers: MapMarker[] = useMemo(() => realMarkers, [realMarkers]);

  /** Resalta en la lista el libro de un marcador pulsado y lo lleva a vista. */
  const handleMarkerSelect = useCallback((bookIdentifier: string) => {
    setSelectedId(bookIdentifier);
    document
      .getElementById(`nearby-book-${CSS.escape(bookIdentifier)}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  /** Obtiene la ubicación, la ciudad y desencadena la búsqueda de libros. */
  const handleShareLocation = useCallback(async () => {
    setResolving(true);
    setLocationError(null);

    let position: GeolocationPosition;
    try {
      position = await getCurrentPosition();
    } catch (caught) {
      setResolving(false);
      setLocationError(toLocationErrorMessage(caught));
      return;
    }

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    // El mapa con el punto del usuario se muestra de inmediato.
    setPosition({ lat, lng });

    // Desglose ciudad → región → país para poder ampliar la búsqueda.
    let scopes: string[];
    try {
      const detailed = await geocoderService.reverseGeocodeDetailed(lat, lng);
      scopes = [detailed.city, detailed.region, detailed.country].filter(
        (scope): scope is string => typeof scope === 'string' && scope.trim().length > 0,
      );
      if (scopes.length === 0) {
        throw new Error('No se pudo determinar la ciudad desde tu ubicación.');
      }
    } catch (caught) {
      setResolving(false);
      setLocationError(normalizeError(caught).message);
      return;
    }

    const detected = scopes[0];
    setResolving(false);
    setSearching(true);
    setSearchError(null);

    // Prueba cada ámbito en orden y se queda con el primero que tenga libros.
    // Así un pueblo sin libros muestra los de su región o país en vez de vacío.
    let matchedScope = detected;
    let matchedTotal = 0;
    let matchedResults: BookSummary[] = [];
    try {
      for (const scope of scopes) {
        const response = await archiveBooksService.searchBooksByCity(scope, 0);
        if (response.total > 0) {
          matchedScope = scope;
          matchedTotal = response.total;
          matchedResults = response.results;
          break;
        }
        // Guarda el primer intento (ciudad) por si ningún ámbito tiene libros.
        if (scope === detected) {
          matchedTotal = response.total;
          matchedResults = response.results;
        }
      }
      setLocation({
        name: matchedScope,
        detected,
        broadened: matchedScope !== detected,
        lat,
        lng,
      });
      setResults(matchedResults);
      setTotal(matchedTotal);
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
    <div className="min-h-svh bg-background pb-[80px] pt-[56px] md:pt-[72px]">
      {/* ─── TopBar Stitch ─────────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 flex h-14 w-full items-center justify-between bg-surface px-5 shadow-sm md:h-[72px] md:px-10">
        <Link
          to="/home"
          aria-label="Volver a buscar"
          className="text-primary transition hover:opacity-80 active:scale-95"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-2xl">
            arrow_back
          </span>
        </Link>
        <h1 className="font-display text-[22px] font-bold tracking-tight text-primary md:text-2xl">
          Cerca de ti
        </h1>
        {location ? (
          <Link
            to="/map"
            aria-label="Ver en el mapa"
            className="text-primary transition hover:opacity-80 active:scale-95"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-2xl">
              map
            </span>
          </Link>
        ) : (
          <span className="w-6" aria-hidden="true" />
        )}
      </header>

      <main className="mx-auto max-w-6xl px-5 pt-4 md:px-10">
        {/* ─── Estado: sin permiso aún ──────────────────────────────────── */}
        {!position && !resolving ? (
          <section className="mx-auto mt-6 flex max-w-[480px] flex-col items-center rounded-[12px] bg-surface-container-lowest px-6 py-10 text-center shadow-card">
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-surface-container-low">
              <span aria-hidden="true" className="material-symbols-outlined text-6xl text-primary">
                location_on
              </span>
            </div>
            <h2 className="mt-8 font-display text-3xl font-bold leading-tight text-on-surface">
              Descubre libros a tu alrededor
            </h2>
            <p className="mt-3 max-w-md text-base leading-relaxed text-on-surface-variant">
              Permítenos saber dónde estás para recomendarte libros cerca de ti. Solo usamos tu
              ciudad para buscar y nunca la guardamos.
            </p>
            {locationError ? (
              <p
                role="alert"
                className="mt-4 w-full rounded-[10px] border border-error bg-error-container px-4 py-3 text-sm text-on-error-container"
              >
                {locationError}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void handleShareLocation()}
              className="mt-8 flex min-h-[52px] w-full items-center justify-center rounded-[12px] bg-primary-container py-3 text-lg font-semibold text-white transition hover:opacity-90 active:scale-[0.99]"
            >
              Continuar
            </button>
            <Link
              to="/home"
              className="mt-4 text-base text-on-surface-variant transition hover:text-on-surface"
            >
              Saltar por ahora
            </Link>
          </section>
        ) : null}

        {/* ─── Estado: obteniendo ubicación (GPS en curso) ──────────────── */}
        {resolving && !position ? (
          <div className="mt-12 flex justify-center py-8">
            <Spinner size="lg" label="Obteniendo tu ubicación…" />
          </div>
        ) : null}

        {/* ─── Resultados: mapa + recomendados ──────────────────────────── */}
        {position && mapCenter ? (
          <section className="mt-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="font-display text-[22px] font-bold tracking-tight text-on-surface">
                {location ? location.name : 'Localizando tus libros…'}
              </h2>
              <span className="text-sm text-on-surface-variant">
                {!location || searching
                  ? null
                  : `${total.toLocaleString('es-CO')} resultado${total === 1 ? '' : 's'}`}
              </span>
            </div>
            {location ? (
              <p className="mb-4 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-base text-primary"
                >
                  location_on
                </span>
                Detectado: {location.detected}
                <button
                  type="button"
                  onClick={() => void handleShareLocation()}
                  className="font-semibold text-primary-container transition hover:opacity-80"
                >
                  Actualizar
                </button>
              </p>
            ) : null}
            {location && location.broadened && !searching ? (
              <p className="mb-4 rounded-[10px] bg-primary-fixed px-4 py-3 text-sm text-on-primary-fixed">
                «{location.detected}» aún no tiene libros asociados: mostramos libros de «
                {location.name}» (búsqueda ampliada).
              </p>
            ) : null}
            {markersNotice ? (
              <p
                role="status"
                className="mb-4 rounded-[10px] border border-secondary-container bg-secondary-container/20 px-4 py-3 text-sm text-on-surface"
              >
                {markersNotice}
              </p>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
              {/* Mapa a la izquierda (fijo en escritorio, arriba en móvil) */}
              <div className="lg:sticky lg:top-[88px]">
                <MapView
                  key={`${mapCenter.lat},${mapCenter.lng}`}
                  center={mapCenter}
                  zoom={15}
                  userPosition={mapCenter}
                  markers={mapMarkers}
                  onMarkerSelect={handleMarkerSelect}
                  className="h-[38vh] min-h-[280px] w-full lg:h-[calc(100vh-240px)] lg:min-h-[420px]"
                />
                <p className="mt-2 text-xs text-on-surface-variant">
                  {mapMarkers.length > 0
                    ? 'Tu ubicación exacta. Pulsa un punto para resaltar su libro en la lista.'
                    : 'Tu ubicación exacta. Los libros recomendados están en la lista.'}
                </p>
              </div>

              {/* Recomendados a la derecha */}
              <div>
                {/* Aún identificando la zona (geocodificación en curso) */}
                {!location && (resolving || searching) ? (
                  <div className="flex justify-center py-12">
                    <Spinner size="lg" label="Identificando tu zona…" />
                  </div>
                ) : null}
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
                    className="rounded-[12px] border border-error bg-error-container px-4 py-3 text-sm text-on-error-container"
                  >
                    {searchError}
                  </div>
                ) : null}

                {/* Vacío */}
                {location && !searching && !searchError && results.length === 0 ? (
                  <div className="flex flex-col items-center rounded-[12px] bg-surface-container-lowest px-6 py-12 text-center shadow-card">
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-5xl text-outline"
                    >
                      menu_book
                    </span>
                    <p className="mt-4 max-w-md text-sm text-on-surface-variant">
                      No encontramos libros relacionados con «{location?.name}» ni con «
                      {location?.detected}». Prueba en otra ubicación o más tarde.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => void handleShareLocation()}
                        className="flex min-h-[48px] items-center rounded-[10px] bg-primary-container px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
                      >
                        Intentar de nuevo
                      </button>
                      <Link
                        to="/map"
                        className="flex min-h-[48px] items-center rounded-[10px] border-[1.5px] border-outline-variant px-6 py-3 text-sm font-medium text-on-surface transition hover:bg-surface-container-low"
                      >
                        Ver el mapa
                      </Link>
                    </div>
                  </div>
                ) : null}

                {/* Lista de resultados */}
                {results.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {results.map((book) => (
                      <div
                        key={book.id}
                        id={`nearby-book-${book.id}`}
                        className={`rounded-[12px] transition ${
                          selectedId === book.id ? 'ring-2 ring-primary-container' : ''
                        }`}
                      >
                        <BookCard book={book} />
                      </div>
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
                      className="flex min-h-[48px] items-center gap-2 rounded-[10px] border-[1.5px] border-outline-variant px-6 py-3 text-sm font-medium text-on-surface transition hover:bg-surface-container-low disabled:opacity-60"
                    >
                      {searching ? <Spinner size="sm" /> : null}
                      {searching ? 'Cargando…' : 'Cargar más'}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <BottomNav />
    </div>
  );
}
