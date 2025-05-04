import { insertFavoritesContentContainer } from "./favorites_content_container";
import { insertFavoritesMenu } from "./favorites_menu";
import { insertFavoritesSearchGalleryContainer } from "../../../../lib/globals/container";

export function createFavoritesPageStructure(): void {
  insertFavoritesSearchGalleryContainer();
  insertFavoritesMenu();
  insertFavoritesContentContainer();
}
