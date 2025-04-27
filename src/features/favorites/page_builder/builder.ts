import {insertFavoritesContentContainer, insertFavoritesMenu} from "./structure";
import {cleanOriginalFavoritesPage} from "./preparer";
import {createFavoriteHTMLTemplates} from "../types/favorite/element";
import {insertFavoritesSearchBox} from "./search_box";
import {insertFavoritesSearchGalleryContainer} from "../../../lib/structure/container";

export function buildFavoritesPage(): void {
  insertFavoritesSearchGalleryContainer();
  cleanOriginalFavoritesPage();
  insertFavoritesContentContainer();
  insertFavoritesMenu();
  insertFavoritesSearchBox();
  createFavoriteHTMLTemplates();
}
