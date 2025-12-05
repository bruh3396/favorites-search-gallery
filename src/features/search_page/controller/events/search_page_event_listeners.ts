import * as SearchPageModel from "../../model/search_page_model";
import * as SearchPageNavigationFlow from "../flows/search_page_navigation_flow";
import * as SearchPageOptionFlow from "../flows/search_page_option_flow";
import * as SearchPageView from "../../view/search_page_view";
import { CrossFeatureRequests } from "../../../../utils/cross_feature/cross_feature_requests";
import { Events } from "../../../../lib/global/events/events";

export function addSearchPageEventListeners(): void {
  CrossFeatureRequests.loadNewSearchPagesInGallery.setResponse(SearchPageNavigationFlow.navigateSearchPages);
  CrossFeatureRequests.infiniteScroll.setResponse(SearchPageModel.usingInfiniteScroll);
  Events.searchPage.layoutChanged.on(SearchPageView.changeLayout);
  Events.searchPage.infiniteScrollToggled.on(SearchPageOptionFlow.toggleInfiniteScroll);
}
