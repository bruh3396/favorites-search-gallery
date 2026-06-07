import { FAVORITES_SEARCH_GALLERY_ENABLED } from "@/app/context/flags";
import { startFeatures } from "@/app/startup/features";
import { startRuntime } from "@/app/startup/runtime";

function startFavoritesSearchGallery(): void {
  if (FAVORITES_SEARCH_GALLERY_ENABLED) {
    startRuntime();
    startFeatures();
  }
}

startFavoritesSearchGallery();
