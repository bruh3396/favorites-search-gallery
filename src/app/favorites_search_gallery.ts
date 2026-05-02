import { FAVORITES_SEARCH_GALLERY_DISABLED } from "../lib/environment/derived_environment";
import { setupAutocomplete } from "../features/autocomplete/autocomplete";
import { setupCaptions } from "../features/caption/caption";
import { setupDownloadMenu } from "../features/downloader/downloader_menu";
import { setupEvents } from "../lib/communication/dom_event_bridge";
import { setupExtensions } from "../lib/media/extension_cache";
import { setupFavorites } from "../features/favorites/favorites_setup";
import { setupGallery } from "../features/gallery/gallery_setup";
import { setupSavedSearches } from "../features/saved_searches/saved_searches";
import { setupSearchPage } from "../features/search_page/controller/flows/search_page_setup_flow";
import { setupServer } from "../lib/server/fetch/post_fetcher";
import { setupShell } from "../lib/shell";
import { setupStyles } from "../lib/ui/style";
import { setupTagModifier } from "../features/tag_modifier/tag_modifier";
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
  setupTagModifier();
  setupAutocomplete();
  setupTooltip();
  setupCaptions();
  setupDownloadMenu();
}

runFavoritesSearchGallery();
