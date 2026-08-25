/**
 * Barra de búsqueda de libros con debounce.
 *
 * Debounce de 450 ms (sin dependencia externa): tras cada pulsación,
 * espera ese intervalo de silencio antes de invocar el callback con
 * el valor actual del campo.
 */
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

/** Props de la barra de búsqueda. */
export interface SearchBarProps {
  /** Texto actual del campo (controlado). */
  value: string;
  /** Se invoca con el valor "debounced" después de 450 ms de silencio. */
  onSearch: (query: string) => void;
  /** Placeholder del campo. */
  placeholder?: string;
  /** Deshabilitar el campo (ej. durante la carga). */
  disabled?: boolean;
}

/** Intervalo de debounce en ms. */
const DEBOUNCE_MS = 450;

/** Barra de búsqueda con icono lupa y debounce. */
export function SearchBar({
  value,
  onSearch,
  placeholder = 'Busca por título o autor…',
  disabled = false,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Emite el debounce tras cada cambio; cancela el anterior si existe. */
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onSearch(localValue);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [localValue, onSearch]);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    setLocalValue(event.target.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      onSearch(localValue);
    }
  }

  function handleClear(): void {
    setLocalValue('');
    onSearch('');
  }

  return (
    <div className="relative">
      {/* Icono lupa */}
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
          clipRule="evenodd"
        />
      </svg>

      <input
        type="search"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-10 pr-10 text-sm text-ink outline-none transition placeholder:text-stone-400 focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
        aria-label="Buscar libros"
      />

      {localValue.length > 0 ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-stone-600"
          aria-label="Limpiar búsqueda"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5">
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
