import * as ContentTiler from "@/app/layout/content_tiler";
import * as FavoritesInfiniteScrollResultsFlow from "@/features/favorites/flows/infinite_scroll_results_flow";
import * as FavoritesSearchFlow from "@/features/favorites/flows/search_flow";
import * as FavoritesView from "@/features/favorites/view/favorites_view";

export function toggleInfiniteScroll(value: boolean): void {
  FavoritesInfiniteScrollResultsFlow.disconnect();
  FavoritesView.togglePaginator(!value);
  ContentTiler.skipNextFade();
  FavoritesSearchFlow.showLatestSearchResults();
}

export function setResultsPerPage(): void {
  ContentTiler.skipNextFade();
  FavoritesSearchFlow.showLatestSearchResults();
}

export function reSearchFavorites(): void {
  ContentTiler.skipNextFade();
  FavoritesSearchFlow.searchActiveFavorites();
}
