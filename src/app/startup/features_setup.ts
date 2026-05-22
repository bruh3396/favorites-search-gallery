import { setupAutocomplete } from "../../features/autocomplete/autocomplete";
import { setupCaptions } from "../../features/caption/caption";
import { setupFavorites } from "../../features/favorites/favorites_setup";
import { setupGallery } from "../../features/gallery/gallery_setup";
import { setupSavedSearches } from "../../features/saved_searches/saved_searches";
import { setupSearchPage } from "../../features/search_page/search_page_setup";
import { setupTooltip } from "../../features/tooltip/tooltip_setup";

export function setupFeatures(): void {
  setupFavorites();
  setupSearchPage();
  setupGallery();
  setupSavedSearches();
  setupAutocomplete();
  setupTooltip();
  setupCaptions();
}
