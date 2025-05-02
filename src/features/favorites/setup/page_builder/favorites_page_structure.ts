// import {FavoritesSettings} from "../../../config/favorites_settings";
// import {buildFavoritesSidebar} from "./sidebar-builder";
import {insertFavoritesContentContainer} from "./favorites_content_container";
import {insertFavoritesMenu} from "./favorites_menu";

export function createFavoritesPageStructure(): void {
  // createSideBarStructure();
  insertFavoritesMenu();
  insertFavoritesContentContainer();
}
