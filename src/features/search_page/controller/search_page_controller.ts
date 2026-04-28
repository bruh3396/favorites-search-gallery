import * as ContentTiler from "../../../lib/layout/layout";
import * as SearchPageModel from "../model/search_page_model";
import * as SearchPageNavigationFlow from "./flows/search_page_navigation_flow";
import * as SearchPageOptionFlow from "./flows/search_page_option_flow";
import { CrossFeatureRequests } from "../../../lib/events/cross_feature_requests";
import { Events } from "../../../lib/events/events";

export function setupSearchPageController(): void {
  CrossFeatureRequests.loadNewSearchPagesInGallery.setHandler(SearchPageNavigationFlow.navigateSearchPages);
  CrossFeatureRequests.latestSearchPageThumbs.setHandler(SearchPageModel.getAllSearchPageThumbs);
  Events.searchPage.layoutChanged.on(ContentTiler.changeLayout);
  Events.searchPage.infiniteScrollToggled.on(SearchPageOptionFlow.toggleInfiniteScroll);
}
