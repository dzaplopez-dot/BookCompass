/**
 * Página del mapa de marcadores de libros de Book Compass.
 *
 * Muestra un mapa Leaflet centrado en la ubicación del usuario (geolocalización
 * al cargar), con los marcadores de la comunidad (`book_markers`) combinados
 * con los de demostración. Cada marcador se pinta del color de su género y
 * abre un popup con la portada, el título y un enlace al detalle.
 */
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { Spinner } from '../components/common/Spinner';
import { useGenres } from '../hooks/useGenres';
import { bookMarkersService } from '../services/book-markers.service';
import { buildDemoMarkers } from '../data/demo-markers';
import type { BookMarker, DemoMarker, WithId } from '../types';
import { getMarkerColor } from '../types/book-marker.types';
import { normalizeError } from '../utils/errors';

/** Unión de marcadores reales y de demostración que se pintan en el mapa. */
type MapMarker = (BookMarker & WithId) | DemoMarker;

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

/** Icono circular de color para un marcador del mapa. */
function coloredIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/** Genera el HTML del popup de Leaflet para un marcador. */
function popupHtml(marker: MapMarker): string {
  const authors = marker.authors.length > 0 ? marker.authors.join(', ') : 'Autor no disponible';
  const cover = marker.coverUrl
    ? `<img src="${marker.coverUrl}" alt="" style="width:60px;height:90px;object-fit:cover;border-radius:6px;float:right;margin:0 0 6px 8px;box-shadow:0 1px 3px rgba(0,0,0,.25)"/>`
    : '';
  const detailLink = `/books/${encodeURIComponent(marker.bookIdentifier)}`;
  return (
    `<div style="min-width:150px">${cover}` +
    `<strong style="display:block;font-size:13px;line-height:1.25">${esc(marker.bookTitle)}</strong>` +
    `<span style="display:block;color:#57534e;font-size:11px;margin-top:2px">${esc(authors)}</span>` +
    `<a href="${detailLink}" style="display:inline-block;margin-top:6px;color:#d97706;font-weight:600;font-size:12px">Ver detalle →</a>` +
    `</div>`
  );
}

/** Escapa caracteres HTML en textos provenientes de la API/usuarios. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Página privada del mapa de marcadores. */
export default function MapPage(): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

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

  // Inicializa el mapa Leaflet cuando el contenedor está montado (tras cargar
  // los marcadores) y pinta los marcadores iniciales + geolocaliza. Corre una
  // única vez porque el contenedor solo existe al pasar a `!loadingMarkers`.
  useEffect(() => {
    if (loadingMarkers) {
      return;
    }
    const container = containerRef.current;
    if (!container || mapRef.current) {
      return;
    }

    const map = L.map(container, { attributionControl: true });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Centrado tentativo; la geolocalización (si el usuario la permite) refina.
    map.setView([center.lat, center.lng], 12);

    // Geolocalización al cargar: centra el mapa en el usuario y marca su punto.
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!mapRef.current) {
            return;
          }
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserPosition({ lat, lng });
          setCenter({ lat, lng });
          mapRef.current.setView([lat, lng], 13);
          L.marker([lat, lng], { icon: coloredIcon('#1c1917') })
            .bindPopup('<strong>Estás aquí</strong>')
            .addTo(mapRef.current);
        },
        () => {
          // Sin permiso o error de geolocalización: se conserva el centrado base.
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 },
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMarkers]);

  // Pinta los marcadores cada vez que cambian (centro o reales).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || loadingMarkers) {
      return;
    }

    const layer = L.layerGroup().addTo(map);

    for (const marker of markers) {
      const color = getMarkerColor(marker.genreIds);
      L.marker([marker.lat, marker.lng], { icon: coloredIcon(color) })
        .bindPopup(popupHtml(marker), { maxWidth: 260 })
        .addTo(layer);
    }

    return () => {
      layer.remove();
    };
  }, [markers, loadingMarkers]);

  const { real, demo } = splitMarkers(markers);
  const totalMarkers = real.length + demo.length;

  return (
    <div className="min-h-svh bg-paper">
      {/* ─── Cabecera ───────────────────────────────────────────────────── */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="font-display text-xl font-bold">🧭 Book Compass</span>
          <div className="flex items-center gap-2">
            <Link
              to="/cerca"
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium transition hover:bg-stone-50"
            >
              📍 Cerca de mí
            </Link>
            <Link
              to="/home"
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium transition hover:bg-stone-50"
            >
              ← Volver a inicio
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Mapa de libros</h1>
            <p className="mt-1 text-sm text-stone-500">
              Descubre dónde hay libros cerca de ti.{' '}
              {totalMarkers > 0 && (
                <span className="font-medium text-stone-700">
                  {totalMarkers} marcador{totalMarkers === 1 ? '' : 'es'}
                </span>
              )}
            </p>
          </div>
          {userPosition ? (
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
              Ubicación detectada
            </span>
          ) : null}
        </div>

        {/* ─── Estado: carga ─────────────────────────────────────────────── */}
        {loadingMarkers ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" label="Cargando mapa…" />
          </div>
        ) : totalMarkers === 0 ? (
          /* ─── Estado: vacío ──────────────────────────────────────────── */
          <p className="py-16 text-center text-sm text-stone-400">
            Aún no hay marcadores en el mapa. Vuelve más tarde para ver dónde hay libros.
          </p>
        ) : (
          /* ─── Estado: exitoso (mapa) ─────────────────────────────────── */
          <>
            {/* Aviso no bloqueante si no se pudieron cargar los marcadores reales */}
            {markersNotice ? (
              <div
                role="alert"
                className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              >
                {markersNotice}
              </div>
            ) : null}
            <div className="overflow-hidden rounded-2xl border border-stone-200 shadow-sm">
              <div ref={containerRef} className="h-[70vh] w-full" />
            </div>
          </>
        )}

        {/* ─── Leyenda de colores por género ────────────────────────────── */}
        {!loadingMarkers && totalMarkers > 0 ? (
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-stone-500">
            <span className="font-semibold text-stone-600">
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
    </div>
  );
}
