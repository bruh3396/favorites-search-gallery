import {cleanOriginalFavoritesPage} from "./preparer";
import {createFavoriteItemHTMLTemplates} from "../types/favorite/element";
import {createFavoritesPageStructure} from "./structure";
import {insertFavoritesSearchBox} from "./search_box";
import {insertFavoritesSearchGalleryContainer} from "../../../lib/structure/container";

export function buildFavoritesPage(): void {
  cleanOriginalFavoritesPage();
  insertFavoritesSearchGalleryContainer();
  createFavoritesPageStructure();
  insertFavoritesSearchBox();
  createFavoriteItemHTMLTemplates();
}
