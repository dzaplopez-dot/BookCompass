/**
 * Limitador de velocidad genérico y reutilizable.
 *
 * Encola tareas asíncronas y las ejecuta de forma serial con un
 * retardo configurable entre cada una, evitando saturar servicios
 * externos (Open Library en nuestro caso).
 */

/** Función asíncrona que representa una tarea encolable. */
type Task<T> = () => Promise<T>;

/**
 * Cola serial que ejecuta una tarea a la vez, con un delay
 * mínimo configurable entre ejecuciones.
 */
export class RateLimiter {
  private delayMs: number;
  private queue: Array<{
    task: Task<unknown>;
    resolve: (v: unknown) => void;
    reject: (e: unknown) => void;
  }> = [];
  private processing = false;

  /**
   * @param delayMs Retardo mínimo (en ms) entre el inicio de cada tarea.
   *   Por defecto 300 ms (recomendado para Open Library: ~100 req/min polite).
   */
  constructor(delayMs = 300) {
    this.delayMs = delayMs;
  }

  /**
   * Encola una tarea y devuelve una promesa que se resuelve con su resultado
   * cuando le toque el turno.
   *
   * @param task Función asíncrona a ejecutar respetando la cola.
   * @returns Promesa con el resultado de la tarea.
   */
  async enqueue<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task: task as Task<unknown>,
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      this.processNext();
    });
  }

  /** Procesa la siguiente tarea de la cola (si hay y no está ocupada). */
  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const item = this.queue.shift()!;
    try {
      const result = await item.task();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      await delay(this.delayMs);
      this.processing = false;
      this.processNext();
    }
  }
}

/** Espera asíncrona el número de milisegundos indicado. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Instancia compartida con el delay recomendado para Open Library. */
export const rateLimiter = new RateLimiter(300);
