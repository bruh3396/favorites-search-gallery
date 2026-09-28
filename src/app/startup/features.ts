import { AppContext } from "@/app/context/context";
import { startFavorites } from "@/features/favorites/favorites";
import { startGallery } from "@/features/gallery/gallery";
import { startPostListNavigator } from "@/features/post_list_navigator/post_list_navigator";
import { startPostOverlay } from "@/features/post_overlay/post_overlay";
import { startTooltip } from "@/features/tooltip/tooltip";

export function launchFeatures(context: AppContext): void {
  startFavorites(context);
  startPostListNavigator(context);
  startGallery(context);
  startTooltip(context);
  startPostOverlay(context);
}
