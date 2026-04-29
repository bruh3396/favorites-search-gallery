import * as SearchPageInfiniteScrollFlow from "./search_page_infinite_scroll_flow";
import * as SearchPageModel from "../../model/search_page_model";
import * as SearchPageView from "../../view/search_page_view";
import { Events } from "../../../../lib/communication/events/events";
import { NavigationKey } from "../../../../types/input";
import { Preferences } from "../../../../lib/preferences/preferences";
import { SearchPage } from "../../model/search_page";

export function navigateSearchPages(direction: NavigationKey): SearchPage | null {
  if (Preferences.searchPageInfiniteScroll.value) {
    SearchPageInfiniteScrollFlow.showMoreResults();
    return null;
  }
  const searchPage = SearchPageModel.navigateSearchPages(direction);

  if (searchPage !== null) {
    SearchPageView.createSearchPage(searchPage);
    Events.searchPage.pageChanged.emit(searchPage);
  }
  return searchPage;
}
