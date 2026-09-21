import { createAppContext } from "@/app/context/context";
import { launchFeatures } from "@/app/startup/features";
import { setupRuntime } from "@/app/startup/runtime";

function runFavoritesSearchGallery(): void {
  const context = createAppContext();

  if (context.flags.favoritesSearchGalleryEnabled) {
    setupRuntime(context);
    launchFeatures(context);
  }
}

runFavoritesSearchGallery();
