import { createFavoritesHelpMenu } from "./favorites_help_menu";
import { insertFavoritesRatingFilter } from "./favorites_rating_filter";
import { insertFavoritesSearchBox } from "./favorites_search_box";

export function createStaticFavoritesMenuElements(): void {
  createFavoritesHelpMenu();
  insertFavoritesRatingFilter();
  insertFavoritesSearchBox();
}
