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
    <div className="min-h-svh bg-paper">
      {/* ─── Cabecera ────────────────────────────────────────────────────── */}
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
              to="/perfil"
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium transition hover:bg-stone-50"
            >
              👤 Perfil
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium transition hover:bg-stone-50"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* ─── Bienvenida ───────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            ¡Bienvenido, {displayName}!
          </h1>

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

        {/* ─── Recomendado para ti ─────────────────────────────────────── */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold tracking-tight">Recomendado para ti</h2>
            <Link to="/onboarding" className="text-sm font-semibold text-brand-700 hover:underline">
              Configurar géneros
            </Link>
          </div>

          {genresLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" label="Cargando tus gustos…" />
            </div>
          ) : !isValid ? (
            <p className="py-6 text-center text-sm text-stone-400">
              Elige al menos 3 géneros para recibir recomendaciones personalizadas.
            </p>
          ) : recommendationsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" label="Buscando recomendaciones…" />
            </div>
          ) : recommendationsError ? (
            <p
              role="alert"
              className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {recommendationsError}
            </p>
          ) : recommendations.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-400">
              Todavía no hay recomendaciones para tus géneros.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {recommendations.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>

        {/* ─── Mis favoritos ─────────────────────────────────────────────── */}
        <section className="mt-8">
          <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Mis favoritos</h2>

          {favoritesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" label="Cargando favoritos…" />
            </div>
          ) : favorites.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-400">
              Aún no has guardado ningún libro. Pulsa ★ en una tarjeta para guardarlo.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {favorites.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>

        {/* ─── Descubrimiento ────────────────────────────────────────────── */}
        <section className="mt-8">
          <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">Descubre libros</h2>
          <SearchBar value={query} onSearch={handleSearch} disabled={loading} />

          {/* Info de resultados */}
          {searched && !error ? (
            <p className="mt-3 text-sm text-stone-500">
              {total > 0
                ? `${total.toLocaleString('es-CO')} resultado${total === 1 ? '' : 's'} para «${query}»`
                : null}
            </p>
          ) : null}

          {/* Error */}
          {error ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
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
            <p className="py-12 text-center text-sm text-stone-400">
              Busca por título o autor para empezar a descubrir libros.
            </p>
          ) : null}

          {/* Sin resultados */}
          {searched && results.length === 0 && !loading && !error ? (
            <p className="py-12 text-center text-sm text-stone-500">
              No encontramos libros para «{query}». Intenta con otros términos.
            </p>
          ) : null}

          {/* Grid de resultados */}
          {results.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
                className="flex items-center gap-2 rounded-lg border border-stone-300 px-6 py-2.5 text-sm font-medium transition hover:bg-stone-50 disabled:opacity-60"
              >
                {loading ? <Spinner size="sm" /> : null}
                {loading ? 'Cargando…' : 'Cargar más'}
              </button>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
