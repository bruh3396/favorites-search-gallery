import {Events} from "../functional/events";

export const FAVORITES_SEARCH_GALLERY_CONTAINER = document.createElement("div");

FAVORITES_SEARCH_GALLERY_CONTAINER.id = "favorites-search-gallery";

export function toggleFavoriteSearchGalleryInteractability(value: boolean): void {
  FAVORITES_SEARCH_GALLERY_CONTAINER.style.pointerEvents = value ? "" : "none";
}

export function insertFavoritesSearchGalleryContainer(): void {
  document.body.appendChild(FAVORITES_SEARCH_GALLERY_CONTAINER);

  Events.global.domLoaded.on(() => {
    document.body.appendChild(FAVORITES_SEARCH_GALLERY_CONTAINER);
  }, {once: true});
}
