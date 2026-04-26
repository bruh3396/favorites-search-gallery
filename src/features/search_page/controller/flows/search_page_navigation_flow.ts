import * as SearchPageInfiniteScrollFlow from "./search_page_infinite_scroll_flow";
import * as SearchPageModel from "../../model/search_page_model";
import * as SearchPageView from "../../view/search_page_view";
import { Events } from "../../../../lib/communication/events";
import { NavigationKey } from "../../../../types/common_types";
import { Preferences } from "../../../../lib/preferences";
import { SearchPage } from "../../../../types/search_page";

export function navigateSearchPages(direction: NavigationKey): SearchPage | null {
  if (Preferences.searchPageInfiniteScrollEnabled.value) {
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
