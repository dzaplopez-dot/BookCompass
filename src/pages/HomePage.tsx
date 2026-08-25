/**
 * Página principal: bienvenida + descubrimiento de libros.
 *
 * Muestra un saludo personalizado y una sección de búsqueda que conecta
 * con Internet Archive a través de {@link archiveBooksService}.
 */
import { useCallback, useState } from 'react';
import { BookCard } from '../components/books/BookCard';
import { SearchBar } from '../components/books/SearchBar';
import { Spinner } from '../components/common/Spinner';
import { useAuth } from '../hooks/useAuth';
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

  // ── Estado de sesión ──────────────────────────────────────────────────────
  const displayName = profile?.displayName ?? user?.displayName ?? user?.email ?? 'lector';

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
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium transition hover:bg-stone-50"
          >
            Cerrar sesión
          </button>
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
