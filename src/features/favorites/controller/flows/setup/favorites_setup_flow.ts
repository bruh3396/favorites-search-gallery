import { ON_FAVORITES_PAGE } from "../../../../../lib/environment/environment";
import { buildFavoritesPage } from "../../../ui/shell/favorites_page_builder";
import { loadAllFavorites } from "./favorites_load_flow";
import { loadTagModifications } from "../../../model/favorites_model";
import { setupFavoritesController } from "../../favorites_controller";
import { setupFavoritesView } from "../../../view/favorites_view";

export function setupFavorites(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  buildFavoritesPage();
  loadTagModifications();
  setupFavoritesView();
  setupFavoritesController();
  loadAllFavorites();
}
