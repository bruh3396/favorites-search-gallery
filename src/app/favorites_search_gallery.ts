import { FAVORITES_SEARCH_GALLERY_ENABLED } from "../lib/global/flags/derived_flags";
import { setupAutocomplete } from "../features/autocomplete/autocomplete";
import { setupCaptions } from "../features/caption/caption";
import { setupDownloadMenu } from "../features/downloader/downloader_menu";
import { setupFavorites } from "../features/favorites/controller/flows/setup/favorites_setup_flow";
import { setupGallery } from "../features/gallery/controller/flows/setup/gallery_setup_flow";
import { setupGlobals } from "../lib/flows/setup";
import { setupSavedSearches } from "../features/saved_searches/saved_searches";
import { setupSearchPage } from "../features/search_page/controller/flows/search_page_setup_flow";
import { setupTagModifier } from "../features/tag_modifier/tag_modifier";
import { setupTooltip } from "../features/tooltip/tooltip";

function runFavoritesSearchGallery(): void {
  setupGlobals();
  setupFavorites();
  setupSearchPage();
  setupGallery();
  setupSavedSearches();
  setupTagModifier();
  setupAutocomplete();
  setupTooltip();
  setupCaptions();
  setupDownloadMenu();
}

if (FAVORITES_SEARCH_GALLERY_ENABLED) {
  runFavoritesSearchGallery();
}
