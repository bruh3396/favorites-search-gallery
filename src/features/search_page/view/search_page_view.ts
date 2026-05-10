import * as ContentTiler from "../../../lib/layout/layout";
import * as SearchPageCreator from "./page_builder";
import { Preferences } from "../../../lib/preferences/preferences";
import { SearchPage } from "../types/search_page";
import { getAllPageThumbs } from "../../../lib/dom/content_thumb";
import { hideUnusedLayoutSizer } from "../../../lib/layout/layout_event_handlers";

export function setupSearchPageView(): void {
  ContentTiler.setupLayout();
  ContentTiler.tile(getAllPageThumbs());
  hideUnusedLayoutSizer(Preferences.searchPageLayout.value);
  toggleInfiniteScroll(Preferences.searchPageInfiniteScroll.value);
}

export function createSearchPage(searchPage: SearchPage): void {
  SearchPageCreator.createSearchPage(searchPage);
}

export function insertNewSearchResults(thumbs: HTMLElement[]): void {
  ContentTiler.addToBottom(thumbs);
}

export function toggleInfiniteScroll(value: boolean): void {
  SearchPageCreator.toggleInfiniteScroll(value);
}
