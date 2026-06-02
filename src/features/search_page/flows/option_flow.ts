import * as SearchPageFavoritesMarkerFlow from "./favorites_marker_flow";
import * as SearchPageInfiniteScrollFlow from "./infinite_scroll_flow";
import * as SearchPageModel from "../model/search_page_model";
import * as SearchPageView from "../view/search_page_view";

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
