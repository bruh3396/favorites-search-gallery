// import {FavoritesSettings} from "../../../config/favorites_settings";
// import {buildFavoritesSidebar} from "./sidebar-builder";
import {insertFavoritesContentContainer} from "./content";
import {insertFavoritesMenu} from "./menu";
// import {insertMainSidebar} from "./sidebar";
// import {moveHeaderToSidebar} from "./utils";

// function createSideBarStructure(): void {
//   if (FavoritesSettings.useSidebar) {
//     insertMainSidebar();
//     buildFavoritesSidebar();
//     moveHeaderToSidebar();
//   }
// }

export function createFavoritesPageStructure(): void {
  // createSideBarStructure();
  insertFavoritesMenu();
  insertFavoritesContentContainer();
}
