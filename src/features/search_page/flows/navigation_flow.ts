import * as SearchPageInfiniteScrollFlow from "./infinite_scroll_flow";
import * as SearchPageModel from "../model/search_page_model";
import * as SearchPageView from "../view/search_page_view";
import { Events } from "../../../app/channels/events";
import { NavigationKey } from "../../../types/input";
import { Preferences } from "../../../app/context/preferences";
import { SearchPage } from "../types/search_page";

export function navigateSearchPages(direction: NavigationKey): SearchPage | null {
  if (Preferences.searchPageInfiniteScroll.value) {
    SearchPageInfiniteScrollFlow.showMoreResults();
    return null;
  }
  const result = SearchPageModel.navigate(direction);

  if (result.searchPage !== null) {
    SearchPageView.renderSearchPage(result.searchPage);
    Events.searchPage.pageChanged.emit(result.searchPage);
  }
  return result.searchPage;
}
