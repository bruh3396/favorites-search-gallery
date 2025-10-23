import * as SearchPageNavigationFlow from "../flows/search_page_navigation_flow";
import * as SearchPageOptionFlow from "../flows/search_page_option_flow";
import * as SearchPageView from "../../view/search_page_view";
import { Events } from "../../../../lib/global/events/events";

export function addSearchPageEventListeners(): void {
  Events.gallery.navigateSearchPages.on(SearchPageNavigationFlow.navigateSearchPages);
  Events.searchPage.layoutChanged.on(SearchPageView.changeLayout);
  Events.searchPage.infiniteScrollToggled.on(SearchPageOptionFlow.toggleInfiniteScroll);
}
