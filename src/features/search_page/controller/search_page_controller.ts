import * as ContentTiler from "../../../lib/global/content/tilers/tiler";
import * as SearchPageModel from "../model/search_page_model";
import * as SearchPageNavigationFlow from "./flows/search_page_navigation_flow";
import * as SearchPageOptionFlow from "./flows/search_page_option_flow";
import { CrossFeatureRequests } from "../../../lib/global/cross_feature_requests";
import { Events } from "../../../lib/global/events/events";

export function setupSearchPageController(): void {
  CrossFeatureRequests.loadNewSearchPagesInGallery.setHandler(SearchPageNavigationFlow.navigateSearchPages);
  CrossFeatureRequests.latestSearchPageThumbs.setHandler(SearchPageModel.getAllSearchPageThumbs);
  Events.searchPage.layoutChanged.on(ContentTiler.changeLayout);
  Events.searchPage.infiniteScrollToggled.on(SearchPageOptionFlow.toggleInfiniteScroll);
}
