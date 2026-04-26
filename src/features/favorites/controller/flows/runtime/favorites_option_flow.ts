import * as FavoritesModel from "../../../model/favorites_model";
import * as FavoritesSearchFlow from "./favorites_search_flow";
import * as FavoritesView from "../../../view/favorites_view";
import { FavoritesInfiniteScrollFlow } from "../presentation/favorites_infinite_scroll_flow";

export function toggleInfiniteScroll(value: boolean): void {
  FavoritesInfiniteScrollFlow.reset();
  FavoritesView.togglePaginationMenu(!value);
  FavoritesSearchFlow.showLatestSearchResults();
}

export function onBlacklistChanged(): void {
  FavoritesModel.onBlacklistChanged();
  searchFavoritesWithNewOptions();
}

export function setResultsPerPage(resultsPerPage: number): void {
  FavoritesView.setResultsPerPage(resultsPerPage);
  FavoritesSearchFlow.showLatestSearchResults();
}

export function searchFavoritesWithNewOptions(): void {
  FavoritesSearchFlow.searchFavorites();
}
