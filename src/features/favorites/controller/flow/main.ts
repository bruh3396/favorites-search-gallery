import * as FavoritesView from "../../view/view";
import {addFavoritesPageEventListeners} from "../event_listeners/event_listeners";
import {buildFavoritesPage} from "../../page_builder/builder";
import {loadAllFavorites} from "./startup";

export function setupFavoritesPage(): void {
  buildFavoritesPage();
  FavoritesView.setupFavoritesView();
  addFavoritesPageEventListeners();
  loadAllFavorites();
}
