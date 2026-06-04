import * as SearchPageInfiniteScrollFlow from "@/features/search_page/flows/infinite_scroll_flow";
import * as SearchPageModel from "@/features/search_page/model/search_page_model";
import * as SearchPageView from "@/features/search_page/view/search_page_view";
import { Events } from "@/app/channels/events";
import { NavigationKey } from "@/types/input";
import { Preferences } from "@/app/context/preferences";
import { SearchPage } from "@/features/search_page/types/search_page";

export function navigateSearchPages(direction: NavigationKey): SearchPage | null {
  if (Preferences.searchPageInfiniteScroll.value) {
    SearchPageInfiniteScrollFlow.showMoreResults();
    return null;
  }
  const result = SearchPageModel.navigate(direction);

  if (result.searchPage !== null) {
    SearchPageView.renderSearchPage(result.searchPage);
    Events.searchPage.pageChanged.emit(result.searchPage.thumbs);
  }
  return result.searchPage;
}
