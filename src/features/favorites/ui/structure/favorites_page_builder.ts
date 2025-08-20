import { buildFavoritesMenu } from "./favorites_menu_builder";
import { cleanOriginalFavoritesPage } from "./favorites_page_cleaner";
import { insertFavoritesContentContainer } from "./favorites_content_container";
import { setupFavoritesBottomNavigationButtons } from "../components/static/favorites_bottom_navigation_buttons";

export function buildFavoritesPage(): void {
  cleanOriginalFavoritesPage();
  buildFavoritesMenu();
  insertFavoritesContentContainer();
  setupFavoritesBottomNavigationButtons();
}
