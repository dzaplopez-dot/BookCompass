/**
 * Botón de guardar/quitar de favoritos.
 *
 * Se superpone a la tarjeta del libro. Debe usarse FUERA de cualquier enlace
 * de navegación para que pulsarlo no dispare la navegación.
 */
import { useFavorites } from '../../hooks/useFavorites';
import type { BookSummary } from '../../types/archive-books.types';

/** Props del botón. */
export interface FavoriteButtonProps {
  book: BookSummary;
}

/** Botón que alterna el estado de favorito de un libro. */
export function FavoriteButton({ book }: FavoriteButtonProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const favorite = isFavorite(book.id);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    event.stopPropagation();

    if (favorite) {
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

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      aria-pressed={favorite}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-lg shadow-card transition active:scale-95 ${
        favorite
          ? 'bg-primary-container text-white hover:opacity-90'
          : 'bg-surface-container-lowest/95 text-outline hover:text-primary-container'
      }`}
    >
      <span aria-hidden="true">{favorite ? '★' : '☆'}</span>
    </button>
  );
}
