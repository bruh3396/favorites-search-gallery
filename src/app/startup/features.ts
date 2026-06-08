import { setupAutocomplete } from "@/features/autocomplete/autocomplete";
import { setupFavorites } from "@/features/favorites/favorites_setup";
import { setupGallery } from "@/features/gallery/gallery_setup";
import { setupPostList } from "@/features/post_list_navigator/post_list_navigator_setup";
import { setupPostOverlay } from "@/features/post_overlay/post_overlay_setup";
import { setupSavedSearches } from "@/features/saved_searches/saved_searches";
import { setupTooltip } from "@/features/tooltip/tooltip_setup";

export function startFeatures(): void {
  setupFavorites();
  setupPostList();
  setupGallery();
  setupSavedSearches();
  setupAutocomplete();
  setupTooltip();
  setupPostOverlay();
}
