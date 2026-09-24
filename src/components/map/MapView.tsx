/**
 * Vista de mapa Leaflet reutilizable de Book Compass.
 *
 * Responsabilidad única: pintar un mapa centrado con el punto del usuario
 * y los marcadores de libros (demostración + comunidad). Cada marcador se
 * colorea según sus géneros y abre un popup con portada, título y enlace al
 * detalle. La carga de datos vive en las páginas; este componente solo
 * renderiza lo que recibe por props.
 */
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BookMarker, DemoMarker, WithId } from '../../types';
import { getMarkerColor } from '../../types/book-marker.types';

/** Unión de marcadores reales (Firestore) y de demostración. */
export type MapMarker = (BookMarker & WithId) | DemoMarker;

/** Coordenadas del centro o de la posición del usuario. */
export interface MapCenter {
  lat: number;
  lng: number;
}

/** Props de la vista de mapa. */
export interface MapViewProps {
  /** Centro inicial del mapa; si cambia, el mapa vuela a él. */
  center: MapCenter;
  /** Zoom inicial. Por defecto 13. */
  zoom?: number;
  /** Posición del usuario (`null` si aún no se conoce). */
  userPosition: MapCenter | null;
  /** Marcadores a pintar (demos + comunidad). */
  markers: MapMarker[];
  /** Clases del contenedor (altura y redondeo los define el padre). */
  className?: string;
  /** Callback al pulsar un marcador, con su identificador de libro. */
  onMarkerSelect?: (bookIdentifier: string) => void;
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

/** Escapa caracteres HTML en textos provenientes de la API/usuarios. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
    `<span style="display:block;color:#42474e;font-size:11px;margin-top:2px">${esc(authors)}</span>` +
    `<a href="${detailLink}" style="display:inline-block;margin-top:6px;color:#2b5f8a;font-weight:600;font-size:12px">Ver detalle →</a>` +
    `</div>`
  );
}

/** Mapa Leaflet con punto de usuario y marcadores de libros. */
export function MapView({
  center,
  zoom = 13,
  userPosition,
  markers,
  className = 'h-[70vh] min-h-[280px] w-full',
  onMarkerSelect,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userLayerRef = useRef<L.Marker | null>(null);
  const selectRef = useRef<MapViewProps['onMarkerSelect']>(onMarkerSelect);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  /** Sincroniza el callback sin recrear la capa de marcadores. */
  useEffect(() => {
    selectRef.current = onMarkerSelect;
  }, [onMarkerSelect]);

  // Inicializa el mapa una sola vez. Tras montar se recalcula el tamaño
  // (`invalidateSize`): si el contenedor aún no tenía dimensiones finales,
  // Leaflet pintaba las teselas en gris.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) {
      return;
    }

    let map: L.Map;
    try {
      map = L.map(container, { attributionControl: true });
    } catch {
      // Fuera del cuerpo del efecto para no encadenar renders.
      queueMicrotask(() =>
        setMapError('No se pudo iniciar el mapa. Revisa tu conexión e inténtalo de nuevo.'),
      );
      return;
    }
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.setView([center.lat, center.lng], zoom);
    map.whenReady(() => setReady(true));

    const frame = requestAnimationFrame(() => {
      map.invalidateSize();
    });
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      userLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vuela al centro cuando la página lo actualiza (p. ej. geolocalización).
  useEffect(() => {
    mapRef.current?.setView([center.lat, center.lng], zoom);
  }, [center.lat, center.lng, zoom]);

  // Punto «Estás aquí» del usuario.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    if (userLayerRef.current) {
      userLayerRef.current.remove();
      userLayerRef.current = null;
    }
    if (!userPosition) {
      return;
    }
    userLayerRef.current = L.marker([userPosition.lat, userPosition.lng], {
      icon: coloredIcon('#064771'),
    })
      .bindPopup('<strong>Estás aquí</strong>')
      .addTo(map);
  }, [userPosition]);

  // Capa de marcadores de libros.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const layer = L.layerGroup().addTo(map);

    for (const marker of markers) {
      const color = getMarkerColor(marker.genreIds);
      const leafletMarker = L.marker([marker.lat, marker.lng], { icon: coloredIcon(color) })
        .bindPopup(popupHtml(marker), { maxWidth: 260 })
        .addTo(layer);
      leafletMarker.on('click', () => {
        selectRef.current?.(marker.bookIdentifier);
      });
    }

    return () => {
      layer.remove();
    };
  }, [markers]);

  return (
    <div className="relative overflow-hidden rounded-[12px] shadow-card">
      {!ready && !mapError ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[500] flex items-center justify-center bg-surface-container"
        >
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-solid border-primary-container border-t-transparent" />
        </div>
      ) : null}
      {mapError ? (
        <div
          role="alert"
          className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-2 bg-surface-container-lowest p-6 text-center"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-4xl text-outline">
            map
          </span>
          <p className="text-sm text-on-surface-variant">{mapError}</p>
        </div>
      ) : null}
      <div
        ref={containerRef}
        className={className}
        role="application"
        aria-label="Mapa de libros"
      />
    </div>
  );
}
