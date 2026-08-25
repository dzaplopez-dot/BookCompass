/**
 * Servicio de analítica local (opción A1).
 *
 * Registra eventos de actividad en `console.debug` y los persiste en
 * `localStorage` con un límite máximo, para que la app pueda mostrar qué
 * ha ocurrido sin depender de servicios externos.
 *
 * Si más adelante se activa Firebase Analytics, solo cambia la
 * implementación interna de esta clase: los consumidores siguen llamando
 * a `track()` igual que hoy.
 */

/** Evento de actividad almacenado. */
export interface StoredEvent {
  /** Nombre del evento (p. ej. `login`, `register`, `logout`). */
  name: string;
  /** Parámetros adicionales del evento. */
  params?: Record<string, unknown>;
  /** Momento del registro en milisegundos desde epoch. */
  at: number;
}

/** Clave bajo la que se persisten los eventos. */
const STORAGE_KEY = 'bookcompass_analytics';

/** Número máximo de eventos conservados en localStorage. */
const MAX_STORED_EVENTS = 100;

/** Servicio de registro de actividad de Book Compass. */
export class AnalyticsService {
  private readonly storageKey: string;
  private readonly maxEvents: number;

  constructor(storageKey = STORAGE_KEY, maxEvents = MAX_STORED_EVENTS) {
    this.storageKey = storageKey;
    this.maxEvents = maxEvents;
  }

  /**
   * Registra un evento de actividad: lo imprime por consola y lo persiste.
   *
   * @param name Nombre estable del evento (p. ej. `'login'`).
   * @param params Parámetros opcionales (p. ej. `{ method: 'google' }`).
   */
  track(name: string, params?: Record<string, unknown>): void {
    const event: StoredEvent = { name, params, at: Date.now() };

    // La consola siempre refleja el evento (útil durante desarrollo).
    console.debug(`[analytics] ${name}`, params ?? '');

    try {
      const events = this.readAll();
      const next = [event, ...events].slice(0, this.maxEvents);
      localStorage.setItem(this.storageKey, JSON.stringify(next));
    } catch {
      // localStorage puede no estar disponible (modo privado, cuota…):
      // el registro en consola ya se produjo, así que no propagamos el fallo.
    }
  }

  /** Devuelve los eventos más recientes, del más nuevo al más antiguo. */
  getRecentEvents(limit = 20): StoredEvent[] {
    return this.readAll().slice(0, limit);
  }

  /** Borra todos los eventos registrados. */
  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Ignorado deliberadamente: sin storage simplemente no hay nada que borrar.
    }
  }

  /** Lee todos los eventos persistidos; tolera JSON corrupto o ausencia de storage. */
  private readAll(): StoredEvent[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as StoredEvent[]) : [];
    } catch {
      return [];
    }
  }
}

/** Instancia única del servicio de analítica para toda la aplicación. */
export const analyticsService = new AnalyticsService();
