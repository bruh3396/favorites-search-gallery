import { Events } from "../lib/communication/events";
import { deferPostPageFetchesUntil } from "../lib/remote/api/post_fetcher";
import { setupAutocomplete } from "./autocomplete/autocomplete";
import { setupCaptions } from "./caption/caption";
import { setupFavorites } from "./favorites/favorites_setup";
import { setupGallery } from "./gallery/gallery_setup";
import { setupSavedSearches } from "./saved_searches/saved_searches";
import { setupSearchPage } from "./search_page/search_page_setup";
import { setupTooltip } from "./tooltip/tooltip_setup";

export function setupFeatures(): void {
  deferPostPageFetchesUntil(Events.favorites.favoritesLoaded.wait());
  setupFavorites();
  setupSearchPage();
  setupGallery();
  setupSavedSearches();
  setupAutocomplete();
  setupTooltip();
  setupCaptions();
}
