import { FAVORITES_SEARCH_GALLERY_ENABLED } from "@/app/context/flags";
import { setupFeatures } from "@/app/startup/features_setup";
import { setupShared } from "@/app/startup/shared_setup";

function runFavoritesSearchGallery(): void {
  if (FAVORITES_SEARCH_GALLERY_ENABLED) {
    setupShared();
    setupFeatures();
  }
}

runFavoritesSearchGallery();
