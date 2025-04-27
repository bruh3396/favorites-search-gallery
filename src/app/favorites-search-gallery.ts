import {FAVORITES_SEARCH_GALLERY_DISABLED, ON_FAVORITES_PAGE} from "../lib/functional/flags";
import {setupCommonStyles} from "../utils/dom/style";
import {setupEvents} from "../lib/functional/events";
import {setupExtensions} from "../store/extensions";
import {setupFavoritesPage} from "../features/favorites/controller/controller";

function runFavoritesSearchGallery(): void {
  if (FAVORITES_SEARCH_GALLERY_DISABLED) {
    return;
  }
  setupEvents();
  setupExtensions();
  setupCommonStyles();

  if (ON_FAVORITES_PAGE) {
    setupFavoritesPage();
  }
}

runFavoritesSearchGallery();
