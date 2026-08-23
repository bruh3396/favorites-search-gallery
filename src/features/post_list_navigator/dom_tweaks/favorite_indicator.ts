const FAVORITE_CLASS = "is-favorite";
const LOADING_CLASS = "is-loading-favorite-indicator";

export function setFavoriteIndicatorLoading(loading: boolean): void {
  document.body.classList.toggle(LOADING_CLASS, loading);
}

export function markAsFavorite(thumb: HTMLElement): void {
  thumb.classList.add(FAVORITE_CLASS);
}

export function markAsFavoriteById(id: string): void {
  const thumb = document.getElementById(id);

  if (thumb !== null) {
    markAsFavorite(thumb);
  }
}

export function unmarkAsFavorite(thumb: HTMLElement): void {
  thumb.classList.remove(FAVORITE_CLASS);
}
