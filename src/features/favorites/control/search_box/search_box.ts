import { FavoritesDesktopSearchBox } from "@/features/favorites/control/search_box/desktop_search_box";
import { FavoritesMenuId } from "@/features/favorites/types/scaffold";
import { FavoritesMobileSearchBox } from "@/features/favorites/control/search_box/mobile_search_box";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";

const DESKTOP_PARENT_ID = FavoritesMenuId.pill;
const MOBILE_PARENT_ID = "left-favorites-panel-top-row";

export function setup(): void {
  if (ON_DESKTOP_DEVICE) {
    new FavoritesDesktopSearchBox(DESKTOP_PARENT_ID);
  } else {
    new FavoritesMobileSearchBox(MOBILE_PARENT_ID);
  }
}
