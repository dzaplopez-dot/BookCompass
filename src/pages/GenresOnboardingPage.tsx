/**
 * Página de selección de géneros literarios (onboarding y edición).
 *
 * Presenta la cuadrícula de géneros y valida en tiempo real que la
 * selección tenga entre 3 y 5, habilitando el botón «Continuar» solo
 * cuando se cumple el mínimo. Guarda la selección (Firestore + localStorage)
 * y navega a `/home`.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GenreSelector } from '../components/home/GenreSelector';
import { Spinner } from '../components/common/Spinner';
import { useGenres } from '../hooks/useGenres';
import { isValidGenreCount, LITERARY_GENRES, MAX_GENRES, MIN_GENRES } from '../types/auth.types';

/** Página privada de selección de géneros favoritos. */
export default function GenresOnboardingPage() {
  const navigate = useNavigate();
  const { genres, loading, saveGenres } = useGenres();

  // Copia local de la selección para poder editar antes de guardar.
  // Se re-sincroniza con los géneros del contexto cuando estos cambian
  // (p. ej. al terminar de cargar), usando el patrón de estado derivado
  // sin effects: si el contexto difiere de lo que ya reflejábamos,
  // actualizamos la selección durante el render.
  const [prevGenres, setPrevGenres] = useState<string[]>(genres);
  const [selection, setSelection] = useState<string[]>(genres);
  if (genres !== prevGenres) {
    setPrevGenres(genres);
    setSelection(genres);
  }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validez de la selección LOCAL (no de lo persistido en el contexto).
  const selectionIsValid = isValidGenreCount(selection);

  /** Alterna un género en la selección local (toggle). */
  function handleToggle(genreId: string): void {
    setSelection((previous) =>
      previous.includes(genreId) ? previous.filter((id) => id !== genreId) : [...previous, genreId],
    );
  }

  /** Guarda la selección y navega al inicio. */
  async function handleContinue(): Promise<void> {
    if (!selectionIsValid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveGenres(selection);
      navigate('/home', { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron guardar los géneros.');
    } finally {
      setSaving(false);
    }
  }
  if (loading) {
    return <Spinner fullScreen label="Cargando tus géneros…" />;
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-paper px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="font-display text-3xl font-bold tracking-tight">Tus géneros favoritos</h1>
        <p className="mt-2 text-sm text-stone-500">
          Elige entre <strong>{MIN_GENRES}</strong> y <strong>{MAX_GENRES}</strong> géneros para
          personalizar tus recomendaciones.
        </p>

        {/* Progreso de validación en tiempo real */}
        <p
          role="status"
          aria-live="polite"
          className={`mt-4 rounded-lg px-4 py-2 text-sm font-medium ${
            selectionIsValid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {selection.length < MIN_GENRES
            ? `Faltan ${MIN_GENRES - selection.length} géneros para continuar (mínimo ${MIN_GENRES}).`
            : selection.length > MAX_GENRES
              ? `Has elegido demasiados: máximo ${MAX_GENRES}.`
              : `¡Perfecto! Seleccionaste ${selection.length} de ${MAX_GENRES} géneros.`}
        </p>

        <div className="mt-5">
          <GenreSelector selection={selection} onToggle={handleToggle} disabled={saving} />
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectionIsValid || saving || selection.length === 0}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Spinner size="sm" /> : null}
          {saving ? 'Guardando…' : 'Continuar'}
        </button>

        <p className="mt-4 text-center text-xs text-stone-400">
          {LITERARY_GENRES.length} géneros disponibles · podrás modificarlos después desde tu perfil
        </p>
      </section>
    </main>
  );
}
