import * as ContentTiler from "../../lib/layout/layout";
import * as SearchPageInfiniteScrollFlow from "./flows/infinite_scroll_flow";
import * as SearchPageModel from "./model/search_page_model";
import * as SearchPageNavigationFlow from "./flows/navigation_flow";
import * as SearchPageOptionFlow from "./flows/option_flow";
import * as SearchPageView from "./view/search_page_view";
import { Events } from "../../lib/communication/events";
import { FeatureBridge } from "../../lib/communication/feature_bridge";
import { ON_SEARCH_PAGE } from "../../lib/environment/environment";
import { Preferences } from "../../lib/preferences/preferences";
import { buildSearchPage } from "./ui/shell";

export function setupSearchPage(): void {
  if (!ON_SEARCH_PAGE || !Preferences.searchPages.value) {
    return;
  }
  SearchPageModel.setupSearchPageModel();
  SearchPageView.setupSearchPageView();
  buildSearchPage();
  SearchPageInfiniteScrollFlow.setupInfiniteScroll();
  addEventListeners();
}

function addEventListeners(): void {
  FeatureBridge.navigateToAdjacentSearchPage.register(SearchPageNavigationFlow.navigateSearchPages);
  FeatureBridge.searchPageItems.register(SearchPageModel.getAllSearchPageThumbs);
  Events.searchPage.layoutChanged.on(ContentTiler.changeLayout);
  Events.searchPage.infiniteScrollToggled.on(SearchPageOptionFlow.toggleInfiniteScroll);
  Events.searchPage.searchPageCreated.emit(SearchPageModel.getInitialSearchPage());
}
