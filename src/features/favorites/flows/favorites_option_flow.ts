import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesSearchFlow from "./favorites_search_flow";
import * as FavoritesView from "../view/favorites_view";
import {FavoritesInfiniteScrollFlow} from "./presentation/favorites_infinite_scroll_flow";

export function toggleInfiniteScroll(value: boolean): void {
  FavoritesInfiniteScrollFlow.reset();
  FavoritesModel.toggleInfiniteScroll(value);
  FavoritesView.togglePaginationMenu(!value);
  FavoritesSearchFlow.showLatestSearchResults();
}
