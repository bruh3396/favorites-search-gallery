import * as SearchPageInfiniteScrollFlow from "./search_page_infinite_scroll_flow";
import * as SearchPageModel from "../../model/search_page_model";
import * as SearchPageView from "../../view/search_page_view";
import { Events } from "../../../../lib/communication/events";
import { ON_SEARCH_PAGE } from "../../../../lib/environment/environment";
import { Preferences } from "../../../../lib/preferences";
import { buildSearchPage } from "../../ui/search_page_builder";
import { setupSearchPageController } from "../search_page_controller";

export function setupSearchPage(): void {
  if (!ON_SEARCH_PAGE || !Preferences.searchPagesEnabled.value) {
    return;
  }
  buildSearchPage();
  SearchPageModel.setupSearchPageModel();
  Events.searchPage.searchPageCreated.emit(SearchPageModel.getInitialSearchPage());
  SearchPageView.setupSearchPageView();
  setupSearchPageController();
  SearchPageInfiniteScrollFlow.setupInfiniteScroll();
}
