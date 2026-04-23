import { Events } from "./events/events";

export const FAVORITES_SEARCH_GALLERY_CONTAINER = document.createElement("div");
export const FAVORITES_SEARCH_GALLERY_ADDONS_CONTAINER = document.createElement("div");

FAVORITES_SEARCH_GALLERY_CONTAINER.id = "favorites-search-gallery";
FAVORITES_SEARCH_GALLERY_ADDONS_CONTAINER.id = "favorites-search-gallery-addons";
FAVORITES_SEARCH_GALLERY_CONTAINER.appendChild(FAVORITES_SEARCH_GALLERY_ADDONS_CONTAINER);

export function toggleFavoriteSearchGalleryInteractability(value: boolean): void {
  FAVORITES_SEARCH_GALLERY_CONTAINER.style.pointerEvents = value ? "" : "none";
}

export function insertFavoritesSearchGalleryContainer(): void {
  if (document.body !== null) {
    document.body.appendChild(FAVORITES_SEARCH_GALLERY_CONTAINER);
    return;
  }

  Events.document.domLoaded.on(() => {
    document.body.appendChild(FAVORITES_SEARCH_GALLERY_CONTAINER);
  }, { once: true });
}
