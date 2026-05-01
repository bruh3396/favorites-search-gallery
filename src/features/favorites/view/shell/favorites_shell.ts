import { buildFavoritesMenu } from "./favorites_menu_builder";
import { clearNativeFavoritesPage } from "./favorites_page_cleaner";
import { insertFavoritesBottomNavigationButtons } from "../../control/components/favorites_bottom_navigation_buttons";

export function setupFavoritesShell(): void {
  clearNativeFavoritesPage();
  buildFavoritesMenu();
  insertFavoritesBottomNavigationButtons();
}
