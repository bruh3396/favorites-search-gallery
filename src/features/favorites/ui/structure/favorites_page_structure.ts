import { insertFavoritesContentContainer } from "./favorites_content_container";
import { insertFavoritesMenu } from "./favorites_menu";

export function createFavoritesPageStructure(): void {
  insertFavoritesMenu();
  insertFavoritesContentContainer();
}
