import { startFavorites } from "@/features/favorites/favorites_startup";
import { startGallery } from "@/features/gallery/gallery_startup";
import { startPostListNavigator } from "@/features/post_list_navigator/post_list_navigator_startup";
import { startPostOverlay } from "@/features/post_overlay/post_overlay_startup";
import { startTooltip } from "@/features/tooltip/tooltip_startup";

export function launchFeatures(): void {
  startFavorites();
  startPostListNavigator();
  startGallery();
  startTooltip();
  startPostOverlay();
}
