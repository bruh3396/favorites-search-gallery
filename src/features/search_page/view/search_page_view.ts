import * as SearchPageCreator from "./search_page_creator";
import { SearchPage } from "../types/search_page";

export function setupSearchPageView(): void {
  SearchPageCreator.setupSearchPageCreator();
}

export function createSearchPage(searchPage: SearchPage): void {
  SearchPageCreator.createSearchPage(searchPage);
}
