import * as FavoritesInfiniteScrollFlow from "@/features/favorites/flows/infinite_scroll_results_flow";
import * as FavoritesSearchFlow from "@/features/favorites/flows/search_flow";
import * as FavoritesView from "@/features/favorites/view/favorites_view";

export function toggleInfiniteScroll(value: boolean): void {
  FavoritesInfiniteScrollFlow.disconnect();
  FavoritesView.togglePaginator(!value);
  FavoritesSearchFlow.showLatestSearchResults();
}

export function setResultsPerPage(): void {
  FavoritesSearchFlow.showLatestSearchResults();
}

export function reSearchFavorites(): void {
  FavoritesSearchFlow.searchActiveFavorites();
}
