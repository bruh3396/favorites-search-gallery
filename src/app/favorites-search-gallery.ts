import {FAVORITES_SEARCH_GALLERY_DISABLED} from "../lib/functional/flags";
import {setupFavoritesSearchGallery} from "../lib/setup/setup";

function runFavoritesSearchGallery(): void {
  if (FAVORITES_SEARCH_GALLERY_DISABLED) {
    return;
  }
  setupFavoritesSearchGallery();
}

runFavoritesSearchGallery();
