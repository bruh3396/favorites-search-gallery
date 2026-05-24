const FAVORITE_CLASS = "is-favorite";

export function markThumbAsFavorite(thumb: HTMLElement): void {
  thumb.classList.add(FAVORITE_CLASS);
}

export function unmarkThumbAsFavorite(thumb: HTMLElement): void {
  thumb.classList.remove(FAVORITE_CLASS);
}
