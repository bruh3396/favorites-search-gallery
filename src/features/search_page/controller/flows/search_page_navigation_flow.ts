import * as SearchPageModel from "../../model/search_page_model";
import * as SearchPageView from "../../view/search_page_view";
import { Events } from "../../../../lib/global/events/events";
import { NavigationKey } from "../../../../types/common_types";
import { Preferences } from "../../../../lib/global/preferences/preferences";

export function navigateSearchPages(direction: NavigationKey): void {
  if (Preferences.searchPageInfiniteScrollEnabled.value) {
    Events.searchPage.returnSearchPage.emit(null);
    return;
  }
  const searchPage = SearchPageModel.navigateSearchPages(direction);

  Events.searchPage.returnSearchPage.emit(searchPage);

  if (searchPage === null) {
    return;
  }
  SearchPageView.createSearchPage(searchPage);
}
