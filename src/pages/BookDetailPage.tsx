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
      <main className="flex min-h-svh items-center justify-center bg-background p-5">
        <div className="w-full max-w-[480px] rounded-[12px] border border-error bg-error-container p-8 text-center shadow-card">
          <p role="alert" className="text-sm text-on-error-container">
            {error}
          </p>
          <Link
            to="/home"
            className="mt-6 inline-block min-h-[48px] rounded-[12px] bg-primary-container px-6 py-3 font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-5">
        <div className="text-center text-on-surface-variant">
          No encontramos el libro solicitado.
        </div>
      </main>
    );
  }

  const favorite = isFavorite(book.id);
  const authorText = book.authors.length > 0 ? book.authors.join(', ') : 'Autor desconocido';

  return (
    <main className="min-h-svh bg-background pb-10 pt-[56px] md:pt-[72px]">
      {/* ─── TopBar ───────────────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 flex h-14 w-full items-center justify-between bg-surface px-5 shadow-sm md:h-[72px] md:px-10">
        <Link
          to="/home"
          aria-label="Volver a buscar"
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-primary transition hover:opacity-80 active:scale-95"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            arrow_back
          </span>
        </Link>
        <h1 className="font-display text-[22px] font-bold tracking-tight text-primary md:text-2xl">
          Detalle
        </h1>
        <button
          type="button"
          onClick={toggleFavorite}
          aria-pressed={favorite}
          aria-label={favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-xl shadow-card transition active:scale-95 ${
            favorite
              ? 'bg-primary-container text-white hover:opacity-90'
              : 'bg-surface-container-lowest text-outline hover:text-primary-container'
          }`}
        >
          <span aria-hidden="true">{favorite ? '★' : '☆'}</span>
        </button>
      </header>

      {/* ─── Tarjeta dos columnas: portada + info ─────────────────────── */}
      <div className="mx-auto max-w-4xl px-5 pt-6 md:px-10">
        <article className="rounded-[12px] bg-surface-container-lowest p-6 shadow-card md:p-8">
          <div className="flex flex-col gap-8 sm:flex-row">
            {/* Portada a la izquierda: ancho limitado al tamaño natural
                (180 px) para que no se pixele al ampliar. */}
            <div className="mx-auto w-44 shrink-0 sm:mx-0 md:w-60">
              <div className="overflow-hidden rounded-[12px] border border-outline-variant bg-surface-container-low shadow-card">
                <BookCover
                  eager
                  sources={{
                    jpeg: book.coverUrl,
                    webp: book.coverUrlWebp,
                    avif: book.coverUrlAvif,
                    alt: `Portada de ${book.title}`,
                  }}
                />
              </div>
              {book.firstPublishYear !== null ? (
                <p className="mt-3 text-center text-sm text-outline sm:text-left">
                  Publicado en {book.firstPublishYear}
                </p>
              ) : null}
            </div>

            {/* Descripción a la derecha */}
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-2xl font-bold leading-tight text-on-surface md:text-3xl">
                {book.title}
              </h2>
              <p className="mt-2 text-lg font-semibold text-on-surface-variant">{authorText}</p>

              {book.subjects.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {book.subjects.slice(0, 4).map((subject) => (
                    <span
                      key={subject}
                      className="rounded bg-primary-fixed px-3 py-1 text-xs font-medium text-on-primary-fixed"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={toggleFavorite}
                  aria-pressed={favorite}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-[12px] bg-primary-container px-6 py-3 text-base font-semibold text-white transition hover:opacity-90 active:scale-95"
                >
                  <span aria-hidden="true">{favorite ? '★' : '☆'}</span>
                  {favorite ? 'Guardado en favoritos' : 'Guardar en favoritos'}
                </button>

                {book.readingUrl ? (
                  <a
                    href={book.readingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-primary-container px-6 py-3 text-base font-semibold text-primary transition hover:bg-surface-container-low"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-lg">
                      menu_book
                    </span>
                    Leer en línea
                  </a>
                ) : null}
              </div>

              {/* Sinopsis */}
              {book.description ? (
                <section className="mt-8">
                  <h3 className="text-lg font-bold text-on-surface">Sinopsis</h3>
                  <p className="mt-2 text-base leading-[1.6] text-on-surface-variant">
                    {book.description}
                  </p>
                </section>
              ) : null}

              {/* Detalles del libro */}
              <section className="mt-8 border-t border-outline-variant pt-6">
                <h3 className="text-lg font-bold text-on-surface">Detalles del Libro</h3>
                <dl className="mt-2 divide-y divide-outline-variant text-sm">
                  {book.publishers.length > 0 ? (
                    <div className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-on-surface-variant">Editorial</dt>
                      <dd className="text-right font-semibold text-on-surface">
                        {book.publishers.join(', ')}
                      </dd>
                    </div>
                  ) : null}
                  {book.firstPublishYear !== null ? (
                    <div className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-on-surface-variant">Año de Publicación</dt>
                      <dd className="text-right font-semibold text-on-surface">
                        {book.firstPublishYear}
                      </dd>
                    </div>
                  ) : null}
                  {book.languages.length > 0 ? (
                    <div className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-on-surface-variant">Idioma</dt>
                      <dd className="text-right font-semibold text-on-surface">
                        {book.languages.join(', ')}
                      </dd>
                    </div>
                  ) : null}
                  {book.pageCount !== null ? (
                    <div className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-on-surface-variant">Páginas</dt>
                      <dd className="text-right font-semibold text-on-surface">{book.pageCount}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              {/* Temas completos */}
              {book.subjects.length > 0 ? (
                <section className="mt-6">
                  <h3 className="text-lg font-bold text-on-surface">Temas</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {book.subjects.slice(0, 12).map((subject) => (
                      <span
                        key={subject}
                        className="rounded bg-surface-container px-3 py-1 text-xs text-on-surface-variant"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
