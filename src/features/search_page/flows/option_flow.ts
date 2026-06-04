import * as SearchPageFavoritesMarkerFlow from "@/features/search_page/flows/favorites_marker_flow";
import * as SearchPageInfiniteScrollFlow from "@/features/search_page/flows/infinite_scroll_flow";
import * as SearchPageModel from "@/features/search_page/model/search_page_model";
import * as SearchPageView from "@/features/search_page/view/search_page_view";

export function toggleInfiniteScroll(value: boolean): void {
  if (value) {
    SearchPageInfiniteScrollFlow.enableInfiniteScroll();
    SearchPageInfiniteScrollFlow.showMoreResults();
  } else {
    SearchPageInfiniteScrollFlow.disableInfiniteScroll();
    SearchPageModel.resetCurrentPageNumber();
    SearchPageView.renderSearchPage(SearchPageModel.getInitialSearchPage());
  }
  SearchPageView.setInfiniteScrollStyle(value);
}

export function toggleFavoriteIndicator(enabled: boolean): Promise<void> {
  SearchPageView.setFavoriteIndicatorSubOptionsVisible(enabled);
  return SearchPageFavoritesMarkerFlow.toggleIndicator(enabled);
}
