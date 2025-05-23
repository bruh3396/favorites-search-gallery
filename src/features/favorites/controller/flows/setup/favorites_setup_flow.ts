import { ON_FAVORITES_PAGE } from "../../../../../lib/globals/flags";
import { addEventListenersToFavoritesPage } from "../../events/favorites_event_listeners";
import { buildFavoritesPage } from "../../../ui/structure/favorites_page_builder";
import { loadAllFavorites } from "./favorites_load_flow";
import { setupFavoriteMetadata } from "../../../types/metadata/favorite_metadata";
import { setupFavoritesView } from "../../../view/favorites_view";

export function setupFavorites(): void {
  if (ON_FAVORITES_PAGE) {
    buildFavoritesPage();
    setupFavoritesView();
    addEventListenersToFavoritesPage();
    setupFavoriteMetadata();
    loadAllFavorites();
  }
}
