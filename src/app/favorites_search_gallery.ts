import { FAVORITES_SEARCH_GALLERY_DISABLED } from "../lib/environment/derived_environment";
import { setupAutocomplete } from "../features/autocomplete/autocomplete";
import { setupCaptions } from "../features/caption/caption";
import { setupDownloadMenu } from "../features/downloader/downloader_menu";
import { setupEvents } from "../lib/events/events";
import { setupExtensions } from "../lib/extension_cache";
import { setupFavorites } from "../features/favorites/controller/flows/setup/favorites_setup_flow";
import { setupGallery } from "../features/gallery/controller/flows/setup/gallery_setup_flow";
import { setupSavedSearches } from "../features/saved_searches/saved_searches";
import { setupSearchPage } from "../features/search_page/controller/flows/search_page_setup_flow";
import { setupServer } from "../lib/server/fetch/api";
import { setupShell } from "../lib/shell";
import { setupStyles } from "../lib/style";
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
