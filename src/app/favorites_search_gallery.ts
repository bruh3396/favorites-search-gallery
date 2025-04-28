import {FAVORITES_SEARCH_GALLERY_ENABLED, ON_FAVORITES_PAGE} from "../lib/functional/flags";
import {setupCommonStyles} from "../utils/dom/style";
import {setupEvents} from "../lib/functional/events";
import {setupExtensions} from "../store/extensions";
import {setupFavoritesPage} from "../features/favorites/controller/flow/main";

function runFavoritesSearchGallery(): void {
  setupEvents();
  setupExtensions();

  if (ON_FAVORITES_PAGE) {
    setupFavoritesPage();
  }
  setupCommonStyles();
}

if (FAVORITES_SEARCH_GALLERY_ENABLED) {
  runFavoritesSearchGallery();
}
