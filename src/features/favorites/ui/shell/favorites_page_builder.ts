import { buildFavoritesMenu } from "./favorites_menu_builder";
import { clearNativeFavoritesPage } from "./favorites_page_cleaner";
import { insertFavoritesBottomNavigationButtons } from "../components/favorites_bottom_navigation_buttons";

export function buildFavoritesPage(): void {
  clearNativeFavoritesPage();
  buildFavoritesMenu();
  insertFavoritesBottomNavigationButtons();
}
