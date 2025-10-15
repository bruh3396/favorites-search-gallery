import * as SearchPageLoader from "./search_page_loader";
import * as SearchPagePreparer from "./search_page_preparer";
import { NavigationKey } from "../../../types/common_types";
import { SearchPage } from "../types/search_page";

export function setupSearchPageModel(): void {
  SearchPagePreparer.prepareAllThumbsOnSearchPage();
  SearchPageLoader.setupSearchPageLoader();
}

export function navigateSearchPages(direction: NavigationKey): SearchPage | null {
  return SearchPageLoader.navigateSearchPages(direction);
}
