import { FavoritesDesktopSearchBox } from "@/features/favorites/control/search_box/desktop_search_box";
import { FavoritesMobileSearchBox } from "@/features/favorites/control/search_box/mobile_search_box";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";

const PARENT_ID = "left-favorites-panel-top-row";

export function setup(): void {
  if (ON_DESKTOP_DEVICE) {
    new FavoritesDesktopSearchBox(PARENT_ID);
  } else {
    new FavoritesMobileSearchBox(PARENT_ID);
  }
}
