import * as FavoritesLoadFlow from "./favorites_load_flow";
import * as FavoritesView from "../../../view/favorites_view";
import { ON_FAVORITES_PAGE } from "../../../../../lib/global/flags/intrinsic_flags";
import { addFavoritesEventsListeners } from "../../events/favorites_event_listeners";
import { buildFavoritesPage } from "../../../ui/structure/favorites_page_builder";

export function setupFavorites(): void {
  if (ON_FAVORITES_PAGE) {
    buildFavoritesPage();
    FavoritesView.setupFavoritesView();
    addFavoritesEventsListeners();
    FavoritesLoadFlow.loadAllFavorites();
  }
}
