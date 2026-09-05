import * as FavoritesSearchBox from "@/features/favorites/control/toolbar/search_box";
import * as FavoritesToolbar from "@/features/favorites/control/toolbar/toolbar";

export function setup(): void {
  FavoritesSearchBox.setup();
  FavoritesToolbar.setup();
}

export { append as appendToSearch, exclude as excludeFromSearch, search as runSearch, clear as clearSearch, handleSearchButtonClicked } from "@/features/favorites/control/toolbar/search_box";
export { mount as mountSettings } from "@/features/favorites/control/settings/settings";
