import { FAVORITES_SEARCH_GALLERY_ENABLED } from "./state/feature_flags";
import { setupFeatures } from "./startup/features_setup";
import { setupShared } from "./startup/shared_setup";

function runFavoritesSearchGallery(): void {
  if (FAVORITES_SEARCH_GALLERY_ENABLED) {
    setupShared();
    setupFeatures();
  }
}

runFavoritesSearchGallery();
