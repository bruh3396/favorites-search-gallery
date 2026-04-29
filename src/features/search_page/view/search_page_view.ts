import * as Layout from "../../../lib/layout/layout";
import * as SearchPageCreator from "./search_page_creator";
import { Preferences } from "../../../lib/preferences/preferences";
import { SearchPage } from "../model/search_page";
import { getAllPageThumbs } from "../../../lib/dom/content_thumb";
import { hideUnusedLayoutSizer } from "../../../lib/layout/layout_event_handlers";

export function setupSearchPageView(): void {
  Layout.setupLayout();
  Layout.tile(getAllPageThumbs());
  hideUnusedLayoutSizer(Preferences.searchPageLayout.value);
  toggleInfiniteScroll(Preferences.searchPageInfiniteScroll.value);
}

export function createSearchPage(searchPage: SearchPage): void {
  SearchPageCreator.createSearchPage(searchPage);
}

export function insertNewSearchResults(thumbs: HTMLElement[]): void {
  Layout.addToBottom(thumbs);
}

export function toggleInfiniteScroll(value: boolean): void {
  SearchPageCreator.toggleInfiniteScroll(value);
}
