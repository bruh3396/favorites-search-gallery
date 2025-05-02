import * as FavoritesView from "../view/favorites_view";
import {addEventListenersToFavoritesPage} from "../controller/favorites_event_listeners";
import {buildFavoritesPage} from "./page_builder/favorites_page_builder";
import {loadAllFavorites} from "../flows/favorites_load_flow";

export function setupFavoritesPage(): void {
  buildFavoritesPage();
  FavoritesView.setupFavoritesView();
  addEventListenersToFavoritesPage();
  loadAllFavorites();
}
