/**
 * Página de perfil del usuario de Book Compass.
 *
 * Muestra la información del usuario (avatar con inicial, nombre, correo,
 * fechas) y permite editar el nombre visible, que se guarda en Firebase Auth
 * y Firestore. También resume sus géneros favoritos y el número de favoritos.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/common/BottomNav';
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
    <div className="min-h-svh bg-background pb-[80px] pt-[56px] md:pt-[72px]">
      {/* ─── TopBar Stitch ─────────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 flex h-14 w-full items-center justify-between bg-surface px-5 shadow-sm md:h-[72px] md:px-10">
        <Link
          to="/home"
          aria-label="Volver a buscar"
          className="text-primary transition hover:opacity-80 active:scale-95"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-2xl">
            arrow_back
          </span>
        </Link>
        <h1 className="font-display text-[22px] font-bold tracking-tight text-primary md:text-2xl">
          BookCompass
        </h1>
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-variant text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-lg">person</span>
        </span>
      </header>

      <main className="mx-auto max-w-3xl px-5 pt-6 md:px-10">
        {/* ─── Cabecera del perfil ─────────────────────────────────────── */}
        <section className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-primary-fixed text-4xl font-bold text-primary shadow-card">
              {initial}
            </div>
            <span
              aria-hidden="true"
              className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-white shadow-card"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </span>
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-on-surface">
            {profile?.displayName ?? user.displayName ?? 'Lector'}
          </h2>
          <p className="mt-1 text-base text-on-surface-variant">{user.email}</p>
        </section>

        {/* ─── Stats ───────────────────────────────────────────────────── */}
        <section className="mt-8 grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center rounded-[12px] bg-surface-container-lowest p-6 text-center shadow-card">
            <span aria-hidden="true" className="material-symbols-outlined text-4xl text-primary">
              bookmark
            </span>
            <p className="mt-2 text-4xl font-bold text-on-surface">{favorites.length}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              Libros marcados
            </p>
          </div>
          <div className="flex flex-col items-center rounded-[12px] bg-surface-container-lowest p-6 text-center shadow-card">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-4xl text-secondary-container"
            >
              category
            </span>
            {genresLoading ? (
              <div className="flex justify-center py-2">
                <Spinner size="sm" />
              </div>
            ) : !isValid ? (
              <p className="mt-2 text-sm text-on-surface-variant">Sin géneros aún</p>
            ) : (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {genreLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded bg-primary-fixed px-2 py-1 text-xs font-medium text-on-primary-fixed"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              Géneros favoritos
            </p>
            <Link
              to="/onboarding"
              className="mt-1 text-xs font-semibold text-primary-container transition hover:opacity-80"
            >
              Configurar
            </Link>
          </div>
        </section>

        {/* ─── Tema (visual, mantiene modo claro actual) ───────────────── */}
        <section className="mt-4 flex items-center justify-between rounded-[12px] bg-surface-container-lowest p-4 shadow-card">
          <span className="flex items-center gap-3 text-base font-semibold text-on-surface">
            <span aria-hidden="true" className="material-symbols-outlined text-outline">
              dark_mode
            </span>
            Tema: Claro / Oscuro
          </span>
          <span
            role="switch"
            aria-checked="false"
            aria-label="Tema oscuro (próximamente)"
            title="Tema oscuro próximamente"
            className="flex h-8 w-14 items-center rounded-full bg-surface-container-highest px-1"
          >
            <span className="h-6 w-6 rounded-full bg-surface-container-lowest shadow-card" />
          </span>
        </section>

        {/* ─── Edición del nombre ───────────────────────────────────────── */}
        <section className="mt-4 rounded-[12px] bg-surface-container-lowest p-6 shadow-card">
          <h3 className="font-display text-lg font-bold text-on-surface">Editar perfil</h3>

          {error ? (
            <p
              role="alert"
              className="mt-3 rounded-[10px] border border-error bg-error-container px-4 py-3 text-sm text-on-error-container"
            >
              {error}
            </p>
          ) : null}

          <form
            onSubmit={(event) => void handleSave(event)}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <label className="flex-1">
              <span className="mb-1 block text-sm font-medium text-on-surface-variant">
                Nombre visible
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  if (saved) setSaved(false);
                }}
                placeholder="Tu nombre"
                className="w-full rounded-[10px] border border-outline-variant bg-surface-container-lowest px-3 py-3 text-sm text-on-surface outline-none transition placeholder:text-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container"
              />
            </label>
            <button
              type="submit"
              disabled={saving || displayName.trim().length === 0}
              className="min-h-[48px] rounded-[12px] bg-primary-container px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </form>

          {saved ? (
            <p className="mt-3 text-sm font-medium text-primary">
              Perfil actualizado correctamente.
            </p>
          ) : null}
        </section>

        {/* ─── Datos de la cuenta ───────────────────────────────────────── */}
        <section className="mt-4 rounded-[12px] bg-surface-container-lowest p-6 shadow-card">
          <h3 className="font-display text-lg font-bold text-on-surface">Datos de la cuenta</h3>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-[10px] bg-surface-container-low p-4">
              <dt className="text-xs uppercase tracking-wide text-outline">Correo</dt>
              <dd className="mt-1 break-all font-medium text-on-surface">{user.email}</dd>
            </div>
            <div className="rounded-[10px] bg-surface-container-low p-4">
              <dt className="text-xs uppercase tracking-wide text-outline">Miembro desde</dt>
              <dd className="mt-1 font-medium text-on-surface">{formatDate(profile?.createdAt)}</dd>
            </div>
            <div className="rounded-[10px] bg-surface-container-low p-4">
              <dt className="text-xs uppercase tracking-wide text-outline">Último acceso</dt>
              <dd className="mt-1 font-medium text-on-surface">
                {formatDate(profile?.lastLoginAt)}
              </dd>
            </div>
          </dl>
        </section>

        {/* ─── Cerrar sesión ────────────────────────────────────────────── */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => void logout()}
            className="min-h-[48px] rounded-[10px] border-[1.5px] border-error px-6 py-2.5 text-sm font-medium text-error transition hover:bg-error-container"
          >
            Cerrar sesión
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
