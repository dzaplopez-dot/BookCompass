/**
 * Página principal: bienvenida + descubrimiento de libros.
 *
 * Muestra un saludo personalizado y una sección de búsqueda que conecta
 * con Internet Archive a través de {@link archiveBooksService}.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookCard } from '../components/books/BookCard';
import { SearchBar } from '../components/books/SearchBar';
import { BottomNav } from '../components/common/BottomNav';
import { Spinner } from '../components/common/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';
import { useGenres } from '../hooks/useGenres';
import { analyticsService } from '../services/analytics.service';
import { archiveBooksService } from '../services/archive-books.service';
import type { BookSummary } from '../types/archive-books.types';
import { normalizeError } from '../utils/errors';

/** Formatea una marca de tiempo en español o devuelve un guión si falta. */
function formatDate(timestamp?: number | null): string {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

/** Página privada de inicio y descubrimiento. */
export default function HomePage() {
  const { user, profile, logout } = useAuth();
  const { favorites, loading: favoritesLoading } = useFavorites();
  const { genres, isValid, loading: genresLoading } = useGenres();

  // ── Estado de sesión ──────────────────────────────────────────────────────
  const displayName = profile?.displayName ?? user?.displayName ?? user?.email ?? 'lector';

  // ── Estado de recomendaciones por géneros ────────────────────────────────
  const [recommendations, setRecommendations] = useState<BookSummary[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  // Carga recomendaciones según los géneros del usuario; se recarga al
  // cambiar la selección si esta es válida. El render decide qué mostrar
  // cuando la selección no es válida, sin necesidad de vaciar el estado.
  useEffect(() => {
    if (!isValid) {
      return;
    }

    let cancelled = false;

    async function loadRecommendations(): Promise<void> {
      setRecommendationsLoading(true);
      setRecommendationsError(null);
      try {
        const response = await archiveBooksService.searchByGenres(genres, 0);
        if (!cancelled) setRecommendations(response.results.slice(0, 10));
      } catch (caught) {
        if (!cancelled) setRecommendationsError(normalizeError(caught).message);
      } finally {
        if (!cancelled) setRecommendationsLoading(false);
      }
    }

    void loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [genres, isValid]);

  // ── Estado de búsqueda ────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  /** Handler estable para el callback de SearchBar (debounce interno). */
  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    setError(null);

    if (!q.trim()) {
      setResults([]);
      setTotal(0);
      setPage(0);
      setSearched(false);
      return;
    }

    setLoading(true);
    try {
      const response = await archiveBooksService.searchBooks(q, 0);
      setResults(response.results);
      setTotal(response.total);
      setPage(0);
      setSearched(true);
      analyticsService.track('book_searched', { query: q.trim(), resultCount: response.total });
    } catch (caught) {
      setError(normalizeError(caught).message);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Carga la siguiente página de resultados. */
  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1;
    setLoading(true);
    try {
      const response = await archiveBooksService.searchBooks(query, nextPage);
      setResults((previous) => [...previous, ...response.results]);
      setTotal(response.total);
      setPage(nextPage);
    } catch (caught) {
      setError(normalizeError(caught).message);
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  /** Cierra la sesión; PrivateRoute redirige a /login automáticamente. */
  async function handleLogout(): Promise<void> {
    try {
      await logout();
    } catch {
      // El error ya quedó registrado en el contexto.
    }
  }

  const hasMore = (page + 1) * 12 < total;

  // ── Render ────────────────────────────────────────────────────────────────

  if (!user) {
    return <Spinner fullScreen label="Cargando…" />;
  }

  return (
    <div className="min-h-svh bg-background pb-[80px] pt-[56px] md:pt-[72px]">
      {/* ─── TopBar Stitch ─────────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 flex h-14 w-full items-center justify-between bg-surface px-5 shadow-sm md:h-[72px] md:px-10">
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="text-primary transition hover:opacity-80 active:scale-95"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-2xl">
            logout
          </span>
        </button>
        <h1 className="font-display text-[22px] font-bold tracking-tight text-primary md:text-2xl">
          Buscar
        </h1>
        <Link
          to="/perfil"
          aria-label="Ir a mi perfil"
          className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-primary-fixed text-xs font-bold text-primary transition hover:opacity-80"
        >
          {(displayName.trim().charAt(0) || 'L').toUpperCase()}
        </Link>
      </header>

      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 pt-4 md:px-10">
        {/* ─── Bienvenida ───────────────────────────────────────────────── */}
        <section className="rounded-[12px] bg-surface-container-lowest p-6 shadow-card sm:p-8">
          <h2 className="font-display text-2xl font-bold tracking-tight text-on-surface">
            ¡Bienvenido, {displayName}!
          </h2>

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

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/cerca"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-[10px] border-[1.5px] border-outline-variant px-4 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-container-low"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-lg text-primary">
                near_me
              </span>
              Libros cerca de mí
            </Link>
          </div>
        </section>

        {/* ─── Descubrimiento ────────────────────────────────────────────── */}
        <section className="mt-2">
          <h2 className="mb-4 font-display text-[22px] font-bold tracking-tight text-on-surface md:text-2xl">
            Descubre libros
          </h2>
          <SearchBar value={query} onSearch={handleSearch} disabled={loading} />

          {/* Info de resultados */}
          {searched && !error ? (
            <p className="mt-3 text-sm text-on-surface-variant">
              {total > 0
                ? `${total.toLocaleString('es-CO')} resultado${total === 1 ? '' : 's'} para «${query}»`
                : null}
            </p>
          ) : null}

          {/* Error */}
          {error ? (
            <div
              role="alert"
              className="mt-4 rounded-[12px] border border-error bg-error-container px-4 py-3 text-sm text-on-error-container"
            >
              {error}
            </div>
          ) : null}

          {/* Cargando */}
          {loading && results.length === 0 ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" label="Buscando libros…" />
            </div>
          ) : null}

          {/* Estado vacío: sin búsqueda */}
          {!searched && !error && !loading ? (
            <p className="py-12 text-center text-sm text-on-surface-variant">
              Busca por título o autor para empezar a descubrir libros.
            </p>
          ) : null}

          {/* Sin resultados */}
          {searched && results.length === 0 && !loading && !error ? (
            <p className="py-12 text-center text-sm text-on-surface-variant">
              No encontramos libros para «{query}». Intenta con otros términos.
            </p>
          ) : null}

          {/* Lista de resultados */}
          {results.length > 0 ? (
            <div className="mt-6 flex flex-col gap-4">
              {results.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : null}

          {/* Cargar más */}
          {hasMore ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loading}
                className="flex min-h-[48px] items-center gap-2 rounded-[10px] border-[1.5px] border-outline-variant px-6 py-3 text-sm font-medium text-on-surface transition hover:bg-surface-container-low disabled:opacity-60"
              >
                {loading ? <Spinner size="sm" /> : null}
                {loading ? 'Cargando…' : 'Cargar más'}
              </button>
            </div>
          ) : null}
        </section>

        {/* ─── Recomendado para ti ─────────────────────────────────────── */}
        <section className="mt-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[22px] font-bold tracking-tight text-on-surface md:text-2xl">
              Recomendado para ti
            </h2>
            <Link
              to="/onboarding"
              className="text-sm font-semibold text-primary-container transition hover:opacity-80"
            >
              Configurar géneros
            </Link>
          </div>

          {genresLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" label="Cargando tus gustos…" />
            </div>
          ) : !isValid ? (
            <p className="py-6 text-center text-sm text-on-surface-variant">
              Elige al menos 3 géneros para recibir recomendaciones personalizadas.
            </p>
          ) : recommendationsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" label="Buscando recomendaciones…" />
            </div>
          ) : recommendationsError ? (
            <p
              role="alert"
              className="rounded-[12px] border border-error bg-error-container px-4 py-3 text-sm text-on-error-container"
            >
              {recommendationsError}
            </p>
          ) : recommendations.length === 0 ? (
            <p className="py-6 text-center text-sm text-on-surface-variant">
              Todavía no hay recomendaciones para tus géneros.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {recommendations.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>

        {/* ─── Mis favoritos ─────────────────────────────────────────────── */}
        <section className="mt-2">
          <h2 className="mb-4 font-display text-[22px] font-bold tracking-tight text-on-surface md:text-2xl">
            Mis favoritos
          </h2>

          {favoritesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" label="Cargando favoritos…" />
            </div>
          ) : favorites.length === 0 ? (
            <p className="py-6 text-center text-sm text-on-surface-variant">
              Aún no has guardado ningún libro. Pulsa ★ en una tarjeta para guardarlo.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {favorites.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
