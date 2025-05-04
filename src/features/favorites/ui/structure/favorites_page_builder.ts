import { cleanOriginalFavoritesPage } from "./favorites_page_preparer";
import { createFavoriteItemHTMLTemplates } from "../../types/favorite/favorite_element";
import { createFavoritesMenuElements } from "../components/favorites_menu_element_creator";
import { createFavoritesPageStructure } from "./favorites_page_structure";

export function buildFavoritesPage(): void {
  cleanOriginalFavoritesPage();
  createFavoritesPageStructure();
  createFavoriteItemHTMLTemplates();
  createFavoritesMenuElements();
}
