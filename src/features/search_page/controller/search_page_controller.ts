import * as ContentTiler from "../../../lib/layout/layout";
import * as SearchPageModel from "../model/search_page_model";
import * as SearchPageNavigationFlow from "./flows/search_page_navigation_flow";
import * as SearchPageOptionFlow from "./flows/search_page_option_flow";
import { Events } from "../../../lib/communication/events/events";
import { FeatureBridge } from "../../../lib/communication/features/feature_bridge";

export function setupSearchPageController(): void {
  FeatureBridge.moreSearchPagesExist.register(SearchPageNavigationFlow.navigateSearchPages);
  FeatureBridge.searchPageItems.register(SearchPageModel.getAllSearchPageThumbs);
  Events.searchPage.layoutChanged.on(ContentTiler.changeLayout);
  Events.searchPage.infiniteScrollToggled.on(SearchPageOptionFlow.toggleInfiniteScroll);
}
