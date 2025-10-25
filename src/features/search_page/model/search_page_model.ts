import * as SearchPageLoader from "./search_page_loader";
import { NavigationKey } from "../../../types/common_types";
import { Preferences } from "../../../lib/global/preferences/preferences";
import { SearchPage } from "../types/search_page";

const infiniteScrollEnabled = Preferences.searchPageInfiniteScrollEnabled.value;

export function setupSearchPageModel(): void {
  SearchPageLoader.setupSearchPageLoader();
}

export function navigateSearchPages(direction: NavigationKey): SearchPage | null {
  return SearchPageLoader.navigateSearchPages(direction);
}

export function usingInfiniteScroll(): boolean {
  return infiniteScrollEnabled;
}

export function getMoreResults(): Promise<HTMLElement[]> {
  return SearchPageLoader.getMoreResults();
}

export function getInitialPageThumbs(): HTMLElement[] {
  return SearchPageLoader.getInitialPageThumbs();
}

export function resetCurrentPageNumber(): void {
  SearchPageLoader.resetCurrentPageNumber();
}
