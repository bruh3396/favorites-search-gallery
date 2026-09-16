import { AppContext } from "@/app/context/context";
import { startFavorites } from "@/features/favorites/startup";
import { startGallery } from "@/features/gallery/startup";
import { startPostListNavigator } from "@/features/post_list_navigator/startup";
import { startPostOverlay } from "@/features/post_overlay/startup";
import { startTooltip } from "@/features/tooltip/startup";

export function launchFeatures(context: AppContext): void {
  startFavorites(context);
  startPostListNavigator(context);
  startGallery(context);
  startTooltip(context);
  startPostOverlay(context);
}
