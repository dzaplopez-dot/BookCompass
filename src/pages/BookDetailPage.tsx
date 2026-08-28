/**
 * Página de detalle de un libro.
 *
 * Carga los metadatos completos del libro mediante {@link archiveBooksService}
 * y los muestra junto a la portada y el botón de leído/favorito.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookCover } from '../components/books/BookCover';
import { Spinner } from '../components/common/Spinner';
import { useFavorites } from '../hooks/useFavorites';
import { archiveBooksService } from '../services/archive-books.service';
import type { BookDetail } from '../types/archive-books.types';
import { normalizeError } from '../utils/errors';

/** Página privada de detalle de un libro. */
export default function BookDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const detail = await archiveBooksService.getBookDetail(id);
        if (!cancelled) setBook(detail);
      } catch (caught) {
        if (!cancelled) setError(normalizeError(caught).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /** Alterna el estado de favorito del libro actual. */
  function toggleFavorite(): void {
    if (!book) return;
    if (isFavorite(book.id)) {
      void removeFavorite(book.id);
    } else {
      void addFavorite({
        id: book.id,
        title: book.title,
        authors: book.authors,
        firstPublishYear: book.firstPublishYear,
        coverUrl: book.coverUrl,
      });
    }
  }

  if (loading) {
    return <Spinner fullScreen label="Cargando libro…" />;
  }

  if (error) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-paper px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-red-300 bg-red-50 p-8 text-center">
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
          <Link
            to="/home"
            className="mt-6 inline-block rounded-lg bg-brand-500 px-6 py-2.5 font-semibold text-white transition hover:bg-brand-700"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-paper px-4 py-10">
        <div className="text-center text-stone-500">No encontramos el libro solicitado.</div>
      </main>
    );
  }

  const favorite = isFavorite(book.id);

  return (
    <main className="min-h-svh bg-paper">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/home" className="font-display text-xl font-bold">
            🧭 Book Compass
          </Link>
          <Link
            to="/home"
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium transition hover:bg-stone-50"
          >
            ← Volver
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Portada */}
          <div className="w-full max-w-xs shrink-0 md:w-64">
            <BookCover
              sources={{
                jpeg: book.coverUrl,
                webp: book.coverUrlWebp,
                avif: book.coverUrlAvif,
                alt: `Portada de ${book.title}`,
              }}
            />
          </div>

          {/* Información */}
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold tracking-tight">{book.title}</h1>

            <p className="mt-1 text-lg text-stone-600">
              {book.authors.length > 0 ? book.authors.join(', ') : 'Autor desconocido'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleFavorite}
                aria-pressed={favorite}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                  favorite
                    ? 'bg-brand-500 text-white hover:bg-brand-700'
                    : 'border border-stone-300 bg-white hover:bg-stone-50'
                }`}
              >
                <span aria-hidden="true">{favorite ? '★' : '☆'}</span>
                {favorite ? 'Guardado' : 'Guardar en favoritos'}
              </button>

              {book.readingUrl ? (
                <a
                  href={book.readingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700"
                >
                  📖 Leer en línea
                </a>
              ) : null}
            </div>

            {/* Metadatos */}
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              {book.firstPublishYear !== null ? (
                <div className="rounded-xl bg-white p-3">
                  <dt className="text-xs uppercase tracking-wide text-stone-400">Año</dt>
                  <dd className="mt-1 font-medium">{book.firstPublishYear}</dd>
                </div>
              ) : null}
              {book.publishers.length > 0 ? (
                <div className="rounded-xl bg-white p-3">
                  <dt className="text-xs uppercase tracking-wide text-stone-400">Editorial</dt>
                  <dd className="mt-1 font-medium">{book.publishers.join(', ')}</dd>
                </div>
              ) : null}
              {book.pageCount !== null ? (
                <div className="rounded-xl bg-white p-3">
                  <dt className="text-xs uppercase tracking-wide text-stone-400">Páginas</dt>
                  <dd className="mt-1 font-medium">{book.pageCount}</dd>
                </div>
              ) : null}
              {book.languages.length > 0 ? (
                <div className="rounded-xl bg-white p-3">
                  <dt className="text-xs uppercase tracking-wide text-stone-400">Idioma</dt>
                  <dd className="mt-1 font-medium">{book.languages.join(', ')}</dd>
                </div>
              ) : null}
            </dl>

            {/* Descripción */}
            {book.description ? (
              <section className="mt-6">
                <h2 className="mb-2 font-display text-xl font-bold">Sinopsis</h2>
                <p className="text-sm leading-relaxed text-stone-600">{book.description}</p>
              </section>
            ) : null}

            {/* Temas */}
            {book.subjects.length > 0 ? (
              <section className="mt-6">
                <h2 className="mb-2 font-display text-xl font-bold">Temas</h2>
                <div className="flex flex-wrap gap-2">
                  {book.subjects.slice(0, 12).map((subject) => (
                    <span
                      key={subject}
                      className="rounded-full bg-stone-200 px-3 py-1 text-xs text-stone-600"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
