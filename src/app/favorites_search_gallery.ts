import { FAVORITES_SEARCH_GALLERY_ENABLED, ON_FAVORITES_PAGE } from "../lib/globals/flags";
import { setupAutocomplete } from "../features/autocomplete/awesomplete";
import { setupFavoritesPage } from "../features/favorites/controller/flows/setup/favorites_setup_flow";
import { setupFavoritesSearchGallery } from "../lib/flows/setup";

function runFavoritesSearchGallery(): void {
  setupFavoritesSearchGallery();

  if (ON_FAVORITES_PAGE) {
    setupFavoritesPage();
  }
  setupAutocomplete();
}

if (FAVORITES_SEARCH_GALLERY_ENABLED) {
  runFavoritesSearchGallery();
}
