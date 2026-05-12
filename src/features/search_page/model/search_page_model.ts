import * as SearchPageLoader from "./loader";
import { NavigationKey } from "../../../types/input";
import { Preferences } from "../../../lib/preferences/preferences";
import { SearchPage } from "../types/search_page";

export function setup(): void {
  SearchPageLoader.setup();
}

export function navigateSearchPages(direction: NavigationKey): SearchPage | null {
  return SearchPageLoader.navigateSearchPages(direction);
}

export function getMoreResults(): Promise<HTMLElement[]> {
  return SearchPageLoader.getMoreResults();
}

export function getInitialSearchPage(): SearchPage {
  return SearchPageLoader.getInitialSearchPage();
}

export function resetCurrentPageNumber(): void {
  SearchPageLoader.resetCurrentPageNumber();
}

export function usingInfiniteScroll(): boolean {
  return Preferences.searchPageInfiniteScroll.value;
}

export function getAllSearchPageThumbs(): HTMLElement[] {
  return SearchPageLoader.getAllSearchPageThumbs();
}
