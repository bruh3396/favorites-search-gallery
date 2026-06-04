import { Preferences } from "@/app/context/preferences";

const FAVORITE_CLASS = "is-favorite";
const LOADING_CLASS = "is-loading-favorite-indicator";

export function setFavoriteIndicatorLoading(loading: boolean): void {
  document.body.classList.toggle(LOADING_CLASS, loading);
}

export function markAsFavorite(thumb: HTMLElement): void {
  thumb.classList.add(FAVORITE_CLASS);
  thumb.dataset.favoriteStyle = Preferences.searchPageFavoriteIndicatorStyle.value;
}

export function markAsFavoriteById(id: string): void {
  const thumb = document.getElementById(id);

  if (thumb !== null) {
    markAsFavorite(thumb);
  }
}

export function unmarkAsFavorite(thumb: HTMLElement): void {
  thumb.classList.remove(FAVORITE_CLASS);
  delete thumb.dataset.favoriteStyle;
}

export function applyCurrentFavoriteStyle(): void {
  const style = Preferences.searchPageFavoriteIndicatorStyle.value;

  for (const thumb of document.querySelectorAll<HTMLElement>(`.${FAVORITE_CLASS}`)) {
    thumb.dataset.favoriteStyle = style;
  }
}

export function setFavoriteIndicatorSubOptionsVisible(visible: boolean): void {
  const ids = ["search-page-favorite-indicator-style", "search-page-gallery-favorite-style"];

  for (const id of ids) {
    const row = document.getElementById(id);

    if (row !== null) {
      row.style.display = visible ? "" : "none";
    }
  }
}

export function applyGalleryFavoriteStyle(thumb: HTMLElement | null): void {
  if (thumb === null) {
    return;
  }
  const container = document.getElementById("gallery-container");

  if (container === null) {
    return;
  }
  const style = Preferences.searchPageGalleryFavoriteStyle.value;
  const isFavorite = thumb.classList.contains(FAVORITE_CLASS);

  if (style === "none" || !isFavorite) {
    delete container.dataset.favoriteStyle;
  } else {
    container.dataset.favoriteStyle = style;
  }
}
