import { FAVORITES_SEARCH_GALLERY_ENABLED } from "@/app/context/flags";
import { launchFeatures } from "@/app/startup/features";
import { setupRuntime } from "@/app/startup/runtime";

function runFavoritesSearchGallery(): void {
  if (FAVORITES_SEARCH_GALLERY_ENABLED) {
    setupRuntime();
    launchFeatures();
  }
}

runFavoritesSearchGallery();
