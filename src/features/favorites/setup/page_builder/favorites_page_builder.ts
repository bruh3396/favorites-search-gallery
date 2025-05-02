import {cleanOriginalFavoritesPage} from "./favorites_page_preparer";
import {createFavoriteItemHTMLTemplates} from "../../types/favorite/favorite_element";
import {createFavoritesPageStructure} from "./favorites_page_structure";
import {insertFavoritesSearchBox} from "./favorites_search_box";
import {insertFavoritesSearchGalleryContainer} from "../../../../lib/structure/container";

export function buildFavoritesPage(): void {
  cleanOriginalFavoritesPage();
  insertFavoritesSearchGalleryContainer();
  createFavoritesPageStructure();
  insertFavoritesSearchBox();
  createFavoriteItemHTMLTemplates();
}
