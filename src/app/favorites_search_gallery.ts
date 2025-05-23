import { FAVORITES_SEARCH_GALLERY_ENABLED } from "../lib/globals/flags";
import { setupAutocomplete } from "../features/autocomplete/awesomplete";
import { setupFavorites } from "../features/favorites/controller/flows/setup/favorites_setup_flow";
import { setupGallery } from "../features/gallery/controller/flows/setup/gallery_setup_flow";
import { setupGlobals } from "../lib/flows/setup";

function runFavoritesSearchGallery(): void {
  setupGlobals();
  setupFavorites();
  setupGallery();
  setupAutocomplete();
}

if (FAVORITES_SEARCH_GALLERY_ENABLED) {
  runFavoritesSearchGallery();
}
