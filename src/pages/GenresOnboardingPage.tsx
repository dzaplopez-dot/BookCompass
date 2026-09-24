/**
 * Página de selección de géneros literarios (onboarding y edición).
 *
 * Presenta la cuadrícula de géneros y valida en tiempo real que la
 * selección tenga entre 3 y 5, habilitando el botón «Continuar» solo
 * cuando se cumple el mínimo. Guarda la selección (Firestore + localStorage)
 * y navega a `/home`.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <main className="min-h-svh bg-background px-5 pb-36 pt-8 md:px-10">
      <div className="mx-auto w-full max-w-xl">
        {/* ─── Paso 2 de 3 ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Link
            to="/home"
            aria-label="Volver"
            className="text-on-surface transition hover:opacity-70 active:scale-95"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-3xl">
              arrow_back
            </span>
          </Link>
          <div aria-hidden="true" className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-outline-variant" />
            <span className="h-2.5 w-10 rounded-full bg-primary-container" />
            <span className="h-2.5 w-2.5 rounded-full bg-outline-variant" />
          </div>
          <span className="w-8" aria-hidden="true" />
        </div>
        <p className="mt-4 text-center text-sm font-medium uppercase tracking-widest text-on-surface-variant">
          Paso 2 de 3
        </p>

        <h1 className="mt-6 text-center font-display text-4xl font-bold leading-tight text-primary">
          Tus gustos literarios
        </h1>
        <p className="mt-3 text-center text-base leading-relaxed text-on-surface-variant">
          Selecciona al menos {MIN_GENRES} géneros favoritos para personalizar tus recomendaciones.
        </p>

        <div className="mt-8">
          <GenreSelector selection={selection} onToggle={handleToggle} disabled={saving} />
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-[10px] border border-error bg-error-container px-4 py-3 text-sm text-on-error-container"
          >
            {error}
          </p>
        ) : null}

        <p className="mt-6 text-center text-xs text-outline">
          {LITERARY_GENRES.length} géneros disponibles · máximo {MAX_GENRES} · podrás modificarlos
          después desde tu perfil
        </p>
      </div>

      {/* ─── Barra inferior fija ─────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant bg-surface-container-lowest px-5 py-4">
        <div className="mx-auto w-full max-w-xl">
          <p
            role="status"
            aria-live="polite"
            className="mb-3 text-center text-sm text-on-surface-variant"
          >
            {selection.length < MIN_GENRES
              ? `Faltan ${MIN_GENRES - selection.length} géneros para continuar (mínimo ${MIN_GENRES}).`
              : selection.length > MAX_GENRES
                ? `Has elegido demasiados: máximo ${MAX_GENRES}.`
                : `${selection.length} géneros seleccionados`}
          </p>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectionIsValid || saving || selection.length === 0}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary-container py-3 text-lg font-semibold text-white transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Spinner size="sm" /> : null}
            {saving ? 'Guardando…' : 'Continuar'}
            {!saving ? (
              <span aria-hidden="true" className="material-symbols-outlined">
                arrow_forward
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </main>
  );
}
