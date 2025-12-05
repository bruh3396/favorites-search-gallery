import * as SearchPageInfiniteScrollFlow from "./search_page_infinite_scroll_flow";
import * as SearchPageModel from "../../model/search_page_model";
import * as SearchPageView from "../../view/search_page_view";
import { NavigationKey } from "../../../../types/common_types";
import { Preferences } from "../../../../lib/global/preferences/preferences";
import { SearchPage } from "../../../../types/search_page";
import { isForwardNavigationKey } from "../../../../types/equivalence";

export function navigateSearchPages(direction: NavigationKey): SearchPage | null {
  if (Preferences.searchPageInfiniteScrollEnabled.value) {
    if (isForwardNavigationKey(direction)) {
      SearchPageInfiniteScrollFlow.showMoreResults();
    }
    return null;
  }
  const searchPage = SearchPageModel.navigateSearchPages(direction);

  if (searchPage !== null) {
    SearchPageView.createSearchPage(searchPage);
  }
  return searchPage;
}
