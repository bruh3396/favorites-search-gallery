import { FavoritesDesktopSearchBox } from "./desktop_search_box";
import { FavoritesMobileSearchBox } from "./mobile_search_box";
import { ON_DESKTOP_DEVICE } from "../../../../lib/environment";

const PARENT_ID = "left-favorites-panel-top-row";

export function setup(): void {
  if (ON_DESKTOP_DEVICE) {
    new FavoritesDesktopSearchBox(PARENT_ID);
  } else {
    new FavoritesMobileSearchBox(PARENT_ID);
  }
}
