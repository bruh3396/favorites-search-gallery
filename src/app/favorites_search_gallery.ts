import { FAVORITES_SEARCH_GALLERY_DISABLED } from "../lib/environment/derived_environment";
import { setupAutocomplete } from "../features/autocomplete/autocomplete";
import { setupCaptions } from "../features/caption/caption";
import { setupFavorites } from "../features/favorites/favorites_setup";
import { setupGallery } from "../features/gallery/gallery_setup";
import { setupLibrary } from "../lib/lib_setup";
import { setupSavedSearches } from "../features/saved_searches/saved_searches";
import { setupSearchPage } from "../features/search_page/search_page_setup";
import { setupTooltip } from "../features/tooltip/tooltip";

function runFavoritesSearchGallery(): void {
  if (FAVORITES_SEARCH_GALLERY_DISABLED) {
    return;
  }
  setupLibrary();
  setupFavorites();
  setupSearchPage();
  setupGallery();
  setupSavedSearches();
  setupAutocomplete();
  setupTooltip();
  setupCaptions();
}

runFavoritesSearchGallery();
