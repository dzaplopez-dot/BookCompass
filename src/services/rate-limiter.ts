/**
 * Limitador de velocidad genérico y reutilizable.
 *
 * Encola tareas asíncronas y las ejecuta con un retardo mínimo entre
 * inicios y un tope de tareas en vuelo, evitando saturar servicios
 * externos (Internet Archive, Nominatim) sin serializar de más.
 */

/** Función asíncrona que representa una tarea encolable. */
type Task<T> = () => Promise<T>;

/** Entrada de la cola con sus continuaciones. */
interface QueueItem {
  task: Task<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

/**
 * Cola que ejecuta tareas con retardo mínimo entre inicios y concurrencia
 * acotada. El orden de inicio respeta el orden de llegada (FIFO).
 */
export class RateLimiter {
  private delayMs: number;
  private maxConcurrent: number;
  private queue: QueueItem[] = [];
  private inFlight = 0;
  private lastStart = 0;
  /** Cadena que serializa la reserva de turnos (las tareas corren en paralelo). */
  private scheduler: Promise<void> = Promise.resolve();
  /** Avisos de hueco libre, en orden de llegada. */
  private slotWaiters: Array<() => void> = [];

  /**
   * @param delayMs Retardo mínimo (en ms) entre el inicio de cada tarea.
   *   Por defecto 300 ms (recomendado para Internet Archive).
   * @param maxConcurrent Máximo de tareas en vuelo simultáneo.
   *   Por defecto 1 (comportamiento serial clásico).
   */
  constructor(delayMs = 300, maxConcurrent = 1) {
    this.delayMs = delayMs;
    this.maxConcurrent = Math.max(1, Math.floor(maxConcurrent));
  }

  /**
   * Encola una tarea y devuelve una promesa que se resuelve con su resultado
   * cuando le toque el turno.
   *
   * @param task Función asíncrona a ejecutar respetando la cola.
   * @returns Promesa con el resultado de la tarea.
   */
  async enqueue<T>(task: Task<T>): Promise<T> {
    const result = new Promise<T>((resolve, reject) => {
      this.queue.push({
        task: task as Task<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
    });
    // `startNext` no lanza por construcción, la cadena nunca se rompe.
    this.scheduler = this.scheduler.then(() => this.startNext());
    return result;
  }

  /** Reserva el siguiente turno de inicio (en orden) y lanza su tarea. */
  private async startNext(): Promise<void> {
    while (this.inFlight >= this.maxConcurrent) {
      await new Promise<void>((resolve) => {
        this.slotWaiters.push(resolve);
      });
    }
    const waitMs = this.delayMs - (Date.now() - this.lastStart);
    if (waitMs > 0) {
      await delay(waitMs);
    }
    const item = this.queue.shift();
    if (!item) {
      return;
    }
    this.inFlight += 1;
    this.lastStart = Date.now();
    void this.run(item);
  }

  /** Ejecuta una tarea y libera su hueco al terminar (éxito o fallo). */
  private async run(item: QueueItem): Promise<void> {
    try {
      item.resolve(await item.task());
    } catch (error) {
      item.reject(error);
    } finally {
      this.inFlight -= 1;
      const notify = this.slotWaiters.splice(0);
      for (const wake of notify) {
        wake();
      }
    }
  }
}

/** Espera asíncrona el número de milisegundos indicado. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Instancia compartida para Internet Archive: cortesía entre inicios y hasta 3 en vuelo. */
export const rateLimiter = new RateLimiter(300, 3);
