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
    <div
      role="group"
      aria-label="Géneros literarios favoritos"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
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
            className={`rounded-xl border p-3 text-left transition ${
              selected
                ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500'
                : 'border-stone-200 bg-white hover:border-stone-300'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span className={`block font-semibold ${selected ? 'text-brand-700' : 'text-ink'}`}>
              {selected ? '✓ ' : ''}
              {genre.label}
            </span>
            <span className="mt-1 block text-xs text-stone-500">{genre.description}</span>
          </button>
        );
      })}
    </div>
  );
}
