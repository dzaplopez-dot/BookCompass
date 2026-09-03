/**
 * Página de perfil del usuario de Book Compass.
 *
 * Muestra la información del usuario (avatar con inicial, nombre, correo,
 * fechas) y permite editar el nombre visible, que se guarda en Firebase Auth
 * y Firestore. También resume sus géneros favoritos y el número de favoritos.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Spinner } from '../components/common/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';
import { useGenres } from '../hooks/useGenres';
import { LITERARY_GENRES } from '../types/auth.types';

/** Formatea una marca de tiempo en español o devuelve un guión si falta. */
function formatDate(timestamp?: number | null): string {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

/** Devuelve la inicial para el avatar a partir del nombre o el correo. */
function getInitial(name?: string | null, email?: string | null): string {
  const source = (name ?? email ?? 'L').trim();
  return source.charAt(0).toUpperCase() || 'L';
}

/** Página privada de perfil del usuario. */
export default function ProfilePage(): ReactElement {
  const { user, profile, loading, error, updateProfile, logout, clearError } = useAuth();
  const { favorites } = useFavorites();
  const { genres, isValid, loading: genresLoading } = useGenres();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? user?.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /** Guarda el nombre visible editado. */
  async function handleSave(event: FormEvent): Promise<void> {
    event.preventDefault();
    clearError();
    setSaved(false);
    setSaving(true);
    try {
      await updateProfile({ displayName });
      setSaved(true);
    } catch {
      // El error ya quedó registrado en el contexto.
    } finally {
      setSaving(false);
    }
  }

  const genreLabels = LITERARY_GENRES.filter((genre) => genres.includes(genre.id)).map(
    (genre) => genre.label,
  );

  if (loading) {
    return <Spinner fullScreen label="Cargando perfil…" />;
  }

  if (!user) {
    return <Spinner fullScreen label="Cargando…" />;
  }

  const initial = getInitial(profile?.displayName ?? user.displayName, user.email);

  return (
    <div className="min-h-svh bg-paper">
      {/* ─── Cabecera ───────────────────────────────────────────────────── */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="font-display text-xl font-bold">🧭 Book Compass</span>
          <div className="flex items-center gap-2">
            <Link
              to="/cerca"
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium transition hover:bg-stone-50"
            >
              📍 Cerca
            </Link>
            <Link
              to="/map"
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium transition hover:bg-stone-50"
            >
              🗺️ Mapa
            </Link>
            <Link
              to="/home"
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium transition hover:bg-stone-50"
            >
              ← Inicio
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* ─── Cabecera del perfil: avatar + nombre ─────────────────────── */}
        <section className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-500 text-2xl font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold tracking-tight">
              {profile?.displayName ?? user.displayName ?? 'Lector'}
            </h1>
            <p className="truncate text-sm text-stone-500">{user.email}</p>
          </div>
        </section>

        {/* ─── Edición del nombre ───────────────────────────────────────── */}
        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold">Editar perfil</h2>

          {error ? (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}

          <form
            onSubmit={(event) => void handleSave(event)}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <label className="flex-1">
              <span className="mb-1 block text-sm font-medium text-stone-600">Nombre visible</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  if (saved) setSaved(false);
                }}
                placeholder="Tu nombre"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500"
              />
            </label>
            <button
              type="submit"
              disabled={saving || displayName.trim().length === 0}
              className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </form>

          {saved ? (
            <p className="mt-3 text-sm font-medium text-emerald-600">
              Perfil actualizado correctamente.
            </p>
          ) : null}
        </section>

        {/* ─── Datos de la cuenta ───────────────────────────────────────── */}
        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold">Datos de la cuenta</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-paper p-4">
              <dt className="text-xs uppercase tracking-wide text-stone-400">Correo</dt>
              <dd className="mt-1 break-all font-medium">{user.email}</dd>
            </div>
            <div className="rounded-xl bg-paper p-4">
              <dt className="text-xs uppercase tracking-wide text-stone-400">Miembro desde</dt>
              <dd className="mt-1 font-medium">{formatDate(profile?.createdAt)}</dd>
            </div>
            <div className="rounded-xl bg-paper p-4">
              <dt className="text-xs uppercase tracking-wide text-stone-400">Último acceso</dt>
              <dd className="mt-1 font-medium">{formatDate(profile?.lastLoginAt)}</dd>
            </div>
          </dl>
        </section>

        {/* ─── Mis géneros ──────────────────────────────────────────────── */}
        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Mis géneros</h2>
            <Link to="/onboarding" className="text-sm font-semibold text-brand-700 hover:underline">
              Configurar
            </Link>
          </div>

          {genresLoading ? (
            <div className="flex justify-center py-6">
              <Spinner label="Cargando tus gustos…" />
            </div>
          ) : !isValid ? (
            <p className="mt-3 text-sm text-stone-400">
              Aún no has elegido géneros. Configúralos para recibir recomendaciones.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {genreLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-800"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ─── Mis favoritos ────────────────────────────────────────────── */}
        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold">Mis favoritos</h2>
          <p className="mt-3 text-sm text-stone-500">
            Tienes <span className="font-semibold text-stone-700">{favorites.length}</span> libro
            {favorites.length === 1 ? '' : 's'} guardado{favorites.length === 1 ? '' : 's'}.
          </p>
        </section>

        {/* ─── Cerrar sesión ────────────────────────────────────────────── */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg border border-red-300 px-6 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
          >
            Cerrar sesión
          </button>
        </div>
      </main>
    </div>
  );
}
