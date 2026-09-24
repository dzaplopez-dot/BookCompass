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
  placeholder = 'Busca por título, autor o género',
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
    <div className="relative w-full">
      <span
        aria-hidden="true"
        className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
      >
        search
      </span>

      <input
        type="search"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-[12px] border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-10 text-base text-on-surface outline-none transition placeholder:text-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container disabled:opacity-60"
        aria-label="Buscar libros"
      />

      {localValue.length > 0 ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-outline transition hover:text-on-surface"
          aria-label="Limpiar búsqueda"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-xl">
            cancel
          </span>
        </button>
      ) : null}
    </div>
  );
}
