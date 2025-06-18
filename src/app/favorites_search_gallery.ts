import { FAVORITES_SEARCH_GALLERY_ENABLED } from "../lib/globals/flags";
import { setupAutocomplete } from "../features/autocomplete/autocomplete";
import { setupCaptions } from "../features/caption/caption";
import { setupFavorites } from "../features/favorites/controller/flows/setup/favorites_setup_flow";
import { setupGallery } from "../features/gallery/controller/flows/setup/gallery_setup_flow";
import { setupGlobals } from "../lib/flows/setup";
import { setupSavedSearches } from "../features/saved_searches/saved_searches";
import { setupTooltip } from "../features/tooltip/tooltip";

function runFavoritesSearchGallery(): void {
  setupGlobals();
  setupFavorites();
  setupGallery();
  setupAutocomplete();
  setupSavedSearches();
  setupTooltip();
  setupCaptions();
}

if (FAVORITES_SEARCH_GALLERY_ENABLED) {
  runFavoritesSearchGallery();
}
