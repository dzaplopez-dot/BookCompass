/**
 * Tarjeta visual de un libro resultante de la búsqueda.
 *
 * Es clicable: navega a `/books/:id` para ver el detalle del libro.
 * Muestra portada, título, autor(es) y año de publicación.
 * La portada se renderiza mediante {@link BookCover}, que maneja el
 * formato responsivo (`<picture>`) y las optimizaciones de carga.
 */
import { Link } from 'react-router-dom';
import type { BookSummary } from '../../types/archive-books.types';
import { BookCover } from './BookCover';
import { FavoriteButton } from './FavoriteButton';

/** Props de la tarjeta. */
export interface BookCardProps {
  book: BookSummary;
}

/** Componente tarjeta de libro, clicable hacia su detalle. */
export function BookCard({ book }: BookCardProps) {
  const authorText = book.authors.length > 0 ? book.authors.join(', ') : 'Autor desconocido';

  return (
    <article className="group relative flex gap-4 overflow-hidden rounded-[12px] bg-surface-container-lowest p-3 shadow-card transition hover:shadow-overlay">
      <Link to={`/books/${book.id}`} className="flex flex-1 gap-4" aria-label={book.title}>
        <div className="w-24 shrink-0 overflow-hidden rounded-[8px] bg-surface-container-low">
          <BookCover
            sources={{
              jpeg: book.coverUrl,
              webp: book.coverUrlWebp,
              avif: book.coverUrlAvif,
              alt: `Portada de ${book.title}`,
            }}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-1 pr-8">
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-on-surface">
            {book.title}
          </h3>
          <p className="line-clamp-1 text-base text-on-surface-variant">{authorText}</p>
          {book.firstPublishYear !== null ? (
            <p className="text-sm text-outline">{book.firstPublishYear}</p>
          ) : null}
        </div>
      </Link>

      {/* Botón de favorito superpuesto, fuera del Link para no navegar al pulsarlo. */}
      <div className="absolute right-2 top-2">
        <FavoriteButton book={book} />
      </div>
    </article>
  );
}
