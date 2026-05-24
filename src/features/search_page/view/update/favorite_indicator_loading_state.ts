const LOADING_CLASS = "is-loading-favorite-indicator";

export function setFavoriteIndicatorLoading(loading: boolean): void {
  document.body.classList.toggle(LOADING_CLASS, loading);
}
