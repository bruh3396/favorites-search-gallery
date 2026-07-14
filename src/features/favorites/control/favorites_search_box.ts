import { FavoritesDesktopSearchBox } from "@/features/favorites/control/desktop/search_box";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";

const DESKTOP_PARENT_ID = FavoritesId.searchField;

export function setup(): void {
  if (ON_DESKTOP_DEVICE) {
    new FavoritesDesktopSearchBox(DESKTOP_PARENT_ID);
  }
}
