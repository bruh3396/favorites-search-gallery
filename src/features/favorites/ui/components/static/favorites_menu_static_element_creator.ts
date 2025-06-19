import { createFavoritesHelpMenu } from "./favorites_help_menu";
import { insertFavoritesFinder } from "./favorites_finder";
import { insertFavoritesRatingFilter } from "./favorites_rating_filter";
import { setupFavoritesSearchBox } from "./favorites_search_box";

export function createStaticFavoritesMenuElements(): void {
  insertFavoritesFinder();
  createFavoritesHelpMenu();
  insertFavoritesRatingFilter();
  setupFavoritesSearchBox();
}
