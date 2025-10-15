import * as SearchPageModel from "../../model/search_page_model";
import * as SearchPageView from "../../view/search_page_view";
import { NavigationKey } from "../../../../types/common_types";

export function navigateSearchPages(direction: NavigationKey): void {
  const searchPage = SearchPageModel.navigateSearchPages(direction);

  if (searchPage === null) {
    return;
  }
  SearchPageView.createSearchPage(searchPage);
}
