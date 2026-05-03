import * as ContentTiler from "../../lib/layout/layout";
import * as SearchPageModel from "./model/search_page_model";
import * as SearchPageNavigationFlow from "./flow/search_page_navigation_flow";
import * as SearchPageOptionFlow from "./flow/search_page_option_flow";
import { getInitialSearchPage, setupSearchPageModel } from "./model/search_page_model";
import { Events } from "../../lib/communication/events";
import { FeatureQueries } from "../../lib/communication/feature_queries";
import { ON_SEARCH_PAGE } from "../../lib/environment/environment";
import { Preferences } from "../../lib/preferences/preferences";
import { buildSearchPage } from "./ui/search_page_builder";
import { setupInfiniteScroll } from "./flow/search_page_infinite_scroll_flow";
import { setupSearchPageView } from "./view/search_page_view";

export function setupSearchPage(): void {
  if (!ON_SEARCH_PAGE || !Preferences.searchPages.value) {
    return;
  }
  setupSearchPageModel();
  setupSearchPageView();
  buildSearchPage();

  setupInfiniteScroll();
  addEventListeners();
}

function addEventListeners(): void {
  FeatureQueries.moreSearchPagesExist.register(SearchPageNavigationFlow.navigateSearchPages);
  FeatureQueries.searchPageItems.register(SearchPageModel.getAllSearchPageThumbs);
  Events.searchPage.layoutChanged.on(ContentTiler.changeLayout);
  Events.searchPage.infiniteScrollToggled.on(SearchPageOptionFlow.toggleInfiniteScroll);
  Events.searchPage.searchPageCreated.emit(getInitialSearchPage());
}
