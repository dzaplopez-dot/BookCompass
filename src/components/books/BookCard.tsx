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
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
      <Link to={`/books/${book.id}`} className="flex flex-col">
        <BookCover
          sources={{
            jpeg: book.coverUrl,
            webp: book.coverUrlWebp,
            avif: book.coverUrlAvif,
            alt: `Portada de ${book.title}`,
          }}
        />

        <div className="flex flex-1 flex-col gap-1 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{book.title}</h3>
          <p className="line-clamp-1 text-xs text-stone-500">{authorText}</p>
          {book.firstPublishYear !== null ? (
            <p className="mt-auto text-xs text-stone-400">{book.firstPublishYear}</p>
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
