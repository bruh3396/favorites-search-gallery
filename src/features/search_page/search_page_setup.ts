import * as ContentTiler from "../../app/layout/content_tiler";
import * as SearchPageModel from "./model/search_page_model";
import * as SearchPageNavigationFlow from "./flows/navigation_flow";
import * as SearchPageOptionFlow from "./flows/option_flow";
import * as SearchPageView from "./view/search_page_view";
import { Events } from "../../app/channels/events";
import { FeatureBridge } from "../../app/channels/feature_bridge";
import { ON_SEARCH_PAGE } from "../../lib/environment";
import { Preferences } from "../../app/context/preferences";

export function setupSearchPage(): void {
  if (!ON_SEARCH_PAGE || !Preferences.searchPages.value) {
    return;
  }
  setupModel();
  setupView();
  subscribeToEvents();
  registerBridgeHandlers();
  Events.searchPage.initialSearchPageCreated.emit(SearchPageModel.getInitialSearchPage());
}

function setupModel(): void {
  SearchPageModel.setup();

}

async function setupView(): Promise<void> {
  await SearchPageView.setup();
  Events.searchPage.searchPageReady.emit();
}

function subscribeToEvents(): void {
  Events.searchPage.layoutChanged.on(ContentTiler.changeLayout);
  Events.searchPage.infiniteScrollToggled.on(SearchPageOptionFlow.toggleInfiniteScroll);
}

function registerBridgeHandlers(): void {
  FeatureBridge.currentSearchQuery.register(SearchPageView.currentSearch);
  FeatureBridge.navigateToAdjacentSearchPage.register(SearchPageNavigationFlow.navigateSearchPages);
  FeatureBridge.searchPageThumbs.register(SearchPageModel.allThumbs);
  FeatureBridge.usingInfiniteScroll.register(() => Preferences.searchPageInfiniteScroll.value);
}
