import * as SearchPageInfiniteScrollFlow from "./search_page_infinite_scroll_flow";
import * as SearchPageModel from "../../model/search_page_model";
import * as SearchPageView from "../../view/search_page_view";

export function toggleInfiniteScroll(value: boolean): void {
  if (value) {
    SearchPageInfiniteScrollFlow.enableInfiniteScroll();
    SearchPageInfiniteScrollFlow.showMoreResults();
  } else {
    SearchPageInfiniteScrollFlow.disableInfiniteScroll();
    SearchPageModel.resetCurrentPageNumber();
    SearchPageView.createSearchPage(SearchPageModel.getInitialSearchPage());
  }
  SearchPageView.toggleInfiniteScroll(value);
}
