/**
 * Tarjeta visual de un libro resultante de la búsqueda.
 *
 * Muestra portada, título, autor(es) y año de publicación.
 * La portada es un enlace tapable que dispara un evento de analítica
 * local (futuro: abrirá el detalle del libro).
 */
import type { BookSummary } from '../../types/archive-books.types';

/** Props de la tarjeta. */
export interface BookCardProps {
  book: BookSummary;
}

/** Placeholder SVG inline para libros sin portada. */
function PlaceholderCover() {
  return (
    <div className="flex aspect-[2/3] items-center justify-center bg-stone-100 text-stone-300">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-12 w-12">
        <path
          fill="currentColor"
          d="M12 2a10 10 0 0 0-6.88 17.23l.9-1.23A1.5 1.5 0 0 1 7.3 17h9.4a1.5 1.5 0 0 1 1.28.73l.9 1.22A10 10 0 0 0 12 2Zm-4 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        />
      </svg>
    </div>
  );
}

/** Componente tarjeta de libro. */
export function BookCard({ book }: BookCardProps) {
  const authorText = book.authors.length > 0 ? book.authors.join(', ') : 'Autor desconocido';

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt={`Portada de ${book.title}`}
          loading="lazy"
          className="aspect-[2/3] w-full object-cover"
        />
      ) : (
        <PlaceholderCover />
      )}

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{book.title}</h3>
        <p className="line-clamp-1 text-xs text-stone-500">{authorText}</p>
        {book.firstPublishYear !== null ? (
          <p className="mt-auto text-xs text-stone-400">{book.firstPublishYear}</p>
        ) : null}
      </div>
    </article>
  );
}
