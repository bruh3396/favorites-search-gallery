import { FAVORITES_SEARCH_GALLERY_ENABLED } from "../lib/environment/derived_environment";
import { setupFeatures } from "../features/features_setup";
import { setupLibrary } from "../lib/lib_setup";

function runFavoritesSearchGallery(): void {
  if (FAVORITES_SEARCH_GALLERY_ENABLED) {
    setupLibrary();
    setupFeatures();
  }
}

runFavoritesSearchGallery();
