import { FAVORITES_SEARCH_GALLERY_DISABLED } from "../lib/environment/derived_environment";
import { setupAutocomplete } from "../features/autocomplete/autocomplete";
import { setupCaptions } from "../features/caption/caption";
import { setupEvents } from "../lib/communication/dom_event_bridge";
import { setupExtensions } from "../lib/media/media_extension_resolver";
import { setupFavorites } from "../features/favorites/favorites_setup";
import { setupGallery } from "../features/gallery/gallery_setup";
import { setupSavedSearches } from "../features/saved_searches/saved_searches";
import { setupSearchPage } from "../features/search_page/search_page_setup";
import { setupServer } from "../lib/remote/api/server_client";
import { setupShell } from "../lib/shell";
import { setupStyles } from "../lib/ui/style";
import { setupTooltip } from "../features/tooltip/tooltip";

function runFavoritesSearchGallery(): void {
  if (FAVORITES_SEARCH_GALLERY_DISABLED) {
    return;
  }
  setupServer();
  setupEvents();
  setupExtensions();
  setupStyles();
  setupShell();
  setupFavorites();
  setupSearchPage();
  setupGallery();
  setupSavedSearches();
  setupAutocomplete();
  setupTooltip();
  setupCaptions();
}

runFavoritesSearchGallery();
