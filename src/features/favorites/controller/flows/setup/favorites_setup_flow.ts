import * as FavoritesLoadFlow from "./favorites_load_flow";
import * as FavoritesView from "../../../view/favorites_view";
import { ON_FAVORITES_PAGE } from "../../../../../lib/global/flags/intrinsic_flags";
import { buildFavoritesPage } from "../../../ui/structure/favorites_page_builder";
import { setupFavoritesController } from "../../favorites_controller";

export function setupFavorites(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  buildFavoritesPage();
  FavoritesView.setupFavoritesView();
  setupFavoritesController();
  FavoritesLoadFlow.loadAllFavorites();
}
