import * as FavoritesLoadFlow from "./favorites_load_flow";
import { ON_FAVORITES_PAGE } from "../../../../../lib/environment/environment";
import { buildFavoritesPage } from "../../../ui/structure/favorites_page_builder";
import { setupFavoritesController } from "../../favorites_controller";
import { setupFavoritesModel } from "../../../model/favorites_model";
import { setupFavoritesView } from "../../../view/favorites_view";

export function setupFavorites(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  buildFavoritesPage();
  setupFavoritesModel();
  setupFavoritesView();
  setupFavoritesController();
  FavoritesLoadFlow.loadAllFavorites();
}
