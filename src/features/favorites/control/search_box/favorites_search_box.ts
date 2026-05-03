import { FavoritesDesktopSearchBox } from "./favorites_desktop_search_box";
import { FavoritesMobileSearchBox } from "./favorites_mobile_search_box";
import { ON_DESKTOP_DEVICE } from "../../../../lib/environment/environment";

const PARENT_ID = "left-favorites-panel-top-row";

export function setupFavoritesSearchBox(): void {
  if (ON_DESKTOP_DEVICE) {
    new FavoritesDesktopSearchBox(PARENT_ID);
  } else {
    new FavoritesMobileSearchBox(PARENT_ID);
  }
}
