import { getInitialSearchPage, setupSearchPageModel } from "../../model/search_page_model";
import { Events } from "../../../../lib/communication/events/events";
import { ON_SEARCH_PAGE } from "../../../../lib/environment/environment";
import { Preferences } from "../../../../lib/preferences/preferences";
import { buildSearchPage } from "../../ui/search_page_builder";
import { setupInfiniteScroll } from "./search_page_infinite_scroll_flow";
import { setupSearchPageController } from "../search_page_controller";
import { setupSearchPageView } from "../../view/search_page_view";

export function setupSearchPage(): void {
  if (!ON_SEARCH_PAGE || !Preferences.searchPages.value) {
    return;
  }
  setupSearchPageModel();
  setupSearchPageView();
  buildSearchPage();
  setupSearchPageController();
  setupInfiniteScroll();
  Events.searchPage.searchPageCreated.emit(getInitialSearchPage());
}
