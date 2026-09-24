/**
 * Página del mapa de marcadores de libros de Book Compass.
 *
 * Muestra un mapa Leaflet centrado en la ubicación del usuario (geolocalización
 * al cargar), con los marcadores de la comunidad (`book_markers`) combinados
 * con los de demostración. Cada marcador se pinta del color de su género y
 * abre un popup con la portada, el título y un enlace al detalle.
 */
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/common/BottomNav';
import { Spinner } from '../components/common/Spinner';
import { MapView, type MapMarker } from '../components/map/MapView';
import { useGenres } from '../hooks/useGenres';
import { bookMarkersService } from '../services/book-markers.service';
import { buildDemoMarkers } from '../data/demo-markers';
import type { BookMarker, DemoMarker, WithId } from '../types';
import { getMarkerColor } from '../types/book-marker.types';
import { normalizeError } from '../utils/errors';

/** Divide los marcadores en los reales (Firestore) y los de demostración. */
function splitMarkers(markers: MapMarker[]): {
  real: Array<BookMarker & WithId>;
  demo: DemoMarker[];
} {
  const real: Array<BookMarker & WithId> = [];
  const demo: DemoMarker[] = [];
  for (const marker of markers) {
    if ('demo' in marker && marker.demo) {
      demo.push(marker as DemoMarker);
    } else {
      real.push(marker as BookMarker & WithId);
    }
  }
  return { real, demo };
}

/** Página privada del mapa de marcadores. */
export default function MapPage(): ReactElement {
  const { genres } = useGenres();

  // Centro del mapa: por defecto Bogotá; se actualiza con la geolocalización.
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 4.711,
    lng: -74.0721,
  });
  // Marcadores reales provenientes de Firestore (la comunidad).
  const [realMarkers, setRealMarkers] = useState<Array<BookMarker & WithId>>([]);
  // Marcadores visibles = demostración (relativos al centro) + reales.
  const [loadingMarkers, setLoadingMarkers] = useState(true);
  const [markersNotice, setMarkersNotice] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

  const markers: MapMarker[] = useMemo(
    () => [...buildDemoMarkers(center), ...realMarkers],
    [center, realMarkers],
  );

  // Carga los marcadores de la comunidad al montar.
  useEffect(() => {
    let cancelled = false;

    async function loadMarkers(): Promise<void> {
      setLoadingMarkers(true);
      setMarkersNotice(null);
      try {
        const real = await bookMarkersService.getMarkers();
        if (!cancelled) setRealMarkers(real);
      } catch (caught) {
        // Si la colección aún no está disponible (p. ej. falta aplicar la regla
        // Firestore), degradamos con gracia: se conservan los marcadores de
        // demostración y se muestra un aviso no bloqueante.
        if (!cancelled) {
          setRealMarkers([]);
          setMarkersNotice(normalizeError(caught).message);
        }
      } finally {
        if (!cancelled) setLoadingMarkers(false);
      }
    }

    void loadMarkers();

    return () => {
      cancelled = true;
    };
  }, []);

  // Geolocalización al cargar: centra el mapa en el usuario y marca su punto.
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserPosition({ lat, lng });
        setCenter({ lat, lng });
      },
      () => {
        // Sin permiso o error de geolocalización: se conserva el centrado base.
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 },
    );
  }, []);

  const { real, demo } = splitMarkers(markers);
  const totalMarkers = real.length + demo.length;

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
          BookCompass
        </h1>
        <Link
          to="/perfil"
          aria-label="Ir a mi perfil"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-variant text-on-surface-variant transition hover:opacity-80"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-lg">
            person
          </span>
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-5 pt-4 md:px-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-[22px] font-bold tracking-tight text-on-surface">
              Mapa de libros
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Descubre dónde hay libros cerca de ti.{' '}
              {totalMarkers > 0 && (
                <span className="font-medium text-on-surface">
                  {totalMarkers} marcador{totalMarkers === 1 ? '' : 'es'}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {userPosition ? (
              <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold text-on-primary-fixed">
                Ubicación detectada
              </span>
            ) : null}
            <Link
              to="/cerca"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-[10px] border-[1.5px] border-outline-variant px-4 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-container-low"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-lg text-primary">
                near_me
              </span>
              Cerca de mí
            </Link>
          </div>
        </div>

        {/* ─── Estado: carga ─────────────────────────────────────────────── */}
        {loadingMarkers ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Cargando mapa…" />
          </div>
        ) : totalMarkers === 0 ? (
          /* ─── Estado: vacío ──────────────────────────────────────────── */
          <p className="py-16 text-center text-sm text-on-surface-variant">
            Aún no hay marcadores en el mapa. Vuelve más tarde para ver dónde hay libros.
          </p>
        ) : (
          /* ─── Estado: exitoso (mapa) ─────────────────────────────────── */
          <>
            {/* Aviso no bloqueante si no se pudieron cargar los marcadores reales */}
            {markersNotice ? (
              <div
                role="alert"
                className="mb-3 rounded-[12px] border border-secondary-container bg-secondary-container/20 px-4 py-3 text-sm text-on-surface"
              >
                {markersNotice}
              </div>
            ) : null}
            <MapView
              center={center}
              zoom={userPosition ? 13 : 12}
              userPosition={userPosition}
              markers={markers}
              className="h-[70vh] w-full"
            />
          </>
        )}

        {/* ─── Leyenda de colores por género ────────────────────────────── */}
        {!loadingMarkers && totalMarkers > 0 ? (
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-on-surface-variant">
            <span className="font-semibold text-on-surface">
              {genres.length > 0 ? 'Tus géneros' : 'Géneros'}:
            </span>
            {genres.length > 0
              ? genres.map((genreId) => (
                  <span key={genreId} className="inline-flex items-center gap-1.5">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: getMarkerColor([genreId]) }}
                    />
                    {genreId}
                  </span>
                ))
              : null}
          </div>
        ) : null}
      </main>

      <BottomNav />
    </div>
  );
}
