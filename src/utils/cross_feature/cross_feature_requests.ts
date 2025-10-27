import { Events } from "../../lib/global/events/events";
import { GALLERY_DISABLED } from "../../lib/global/flags/derived_flags";
import { NavigationKey } from "../../types/common_types";
import { SearchPage } from "../../types/search_page";

export function isInGallery(): Promise<boolean> {
  if (GALLERY_DISABLED) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    Events.gallery.inGalleryResponse.timeout(10)
      .then((inGallery) => {
        resolve(inGallery);
      })
      .catch(() => {
        resolve(false);
      });
    Events.favorites.inGalleryRequest.emit();
  });
}

export function getAdjacentSearchPage(direction: NavigationKey): Promise<SearchPage | null> {
  return new Promise((resolve) => {
    Events.searchPage.returnSearchPage.timeout(10)
      .then((searchPage) => {
        resolve(searchPage);
      })
      .catch((error) => {
        console.error(error);
        resolve(null);
      });
    Events.gallery.navigateSearchPages.emit(direction);
  });
}

export function changeFavoritesPageInGallery(direction: NavigationKey): Promise<boolean> {
  return new Promise((resolve) => {
    Events.favorites.pageChangeResponse.timeout(50)
      .then(resolve)
      .catch(() => {
        resolve(false);
      });
    Events.gallery.pageChangeRequested.emit(direction);
  });
}
