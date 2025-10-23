import * as ContentTiler from "../../../../lib/global/content/tilers/tiler";
import * as SearchPageInfiniteScrollFlow from "./search_page_infinite_scroll_flow";
import * as SearchPageModel from "../../model/search_page_model";
import * as SearchPageView from "../../view/search_page_view";

export function toggleInfiniteScroll(value: boolean): void {
  if (value) {
    SearchPageInfiniteScrollFlow.enableInfiniteScroll();
    SearchPageInfiniteScrollFlow.showMoreResults();
  } else {
    SearchPageModel.resetCurrentPageNumber();
    SearchPageInfiniteScrollFlow.disableInfiniteScroll();
    ContentTiler.tile(SearchPageModel.getInitialPageThumbs());
  }
  SearchPageView.toggleInfiniteScroll(value);
}
