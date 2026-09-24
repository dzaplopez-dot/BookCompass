/**
 * Selector de géneros literarios (reutilizable).
 *
 * Muestra la cuadrícula de géneros y permite marcar/desmarcar con la
 * validación de negocio (mínimo 3, máximo 5) aplicada en tiempo real.
 * Es un componente controlado: recibe la selección y notifica cambios.
 */
import { LITERARY_GENRES, MAX_GENRES } from '../../types/auth.types';

/** Props del selector de géneros. */
export interface GenreSelectorProps {
  /** Identificadores de género actualmente seleccionados. */
  selection: string[];
  /** Callback al cambiar la selección (toggle de un género). */
  onToggle(genreId: string): void;
  /** Deshabilita la interacción (p. ej. mientras se guarda). */
  disabled?: boolean;
}

/**
 * Renderiza la cuadrícula de géneros con su estado de selección.
 */
export function GenreSelector({ selection, onToggle, disabled = false }: GenreSelectorProps) {
  return (
    <div role="group" aria-label="Géneros literarios favoritos" className="grid grid-cols-2 gap-4">
      {LITERARY_GENRES.map((genre) => {
        const selected = selection.includes(genre.id);
        const disabledToggle = disabled || (!selected && selection.length >= MAX_GENRES);
        return (
          <button
            key={genre.id}
            type="button"
            aria-pressed={selected}
            disabled={disabledToggle}
            onClick={() => onToggle(genre.id)}
            title={genre.description}
            className={`flex min-h-[56px] items-center justify-between gap-2 rounded-[8px] border-[1.5px] border-primary-container p-4 text-left transition active:scale-[0.98] ${
              selected
                ? 'bg-primary-fixed text-primary'
                : 'bg-surface-container-lowest text-primary-container hover:bg-surface-container-low'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span className="block text-base font-medium">{genre.label}</span>
            <span className="sr-only">. {genre.description}</span>
            {selected ? (
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                check
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
