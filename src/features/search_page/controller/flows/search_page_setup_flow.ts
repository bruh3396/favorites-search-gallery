import * as SearchPageModel from "../../model/search_page_model";
import * as SearchPageView from "../../view/search_page_view";
import { ON_SEARCH_PAGE } from "../../../../lib/global/flags/intrinsic_flags";
import { Preferences } from "../../../../lib/global/preferences/preferences";
import { addSearchPageEventListeners } from "../events/search_page_event_listeners";
import { setupFavoritesTiler } from "../../../favorites/view/content/tilers/favorites_tiler";

export function setupSearchPage(): void {
  if (ON_SEARCH_PAGE && Preferences.searchPagesEnabled.value) {
    SearchPageModel.setupSearchPageModel();
    SearchPageView.setupSearchPageView();
    addSearchPageEventListeners();
    setupFavoritesTiler();
  }
}
