import * as ContentTiler from "../../../lib/global/content/tilers/tiler";
import * as SearchPageCreator from "./search_page_creator";
import { Layout } from "../../../types/common_types";
import { Preferences } from "../../../lib/global/preferences/preferences";
import { SearchPage } from "../../../types/search_page";
import { getAllThumbs } from "../../../utils/dom/dom";
import { hideUnusedLayoutSizer } from "../../../lib/global/content/tilers/tiler_event_handlers";

export function setupSearchPageView(): void {
  ContentTiler.setupTiler();
  ContentTiler.tile(getAllThumbs());
  hideUnusedLayoutSizer(Preferences.searchPageLayout.value);
  toggleInfiniteScroll(Preferences.searchPageInfiniteScrollEnabled.value);
}

export function createSearchPage(searchPage: SearchPage): void {
  SearchPageCreator.createSearchPage(searchPage);
}

export function changeLayout(layout: Layout): void {
  ContentTiler.changeLayout(layout);
}

export function insertNewSearchResults(thumbs: HTMLElement[]): void {
  ContentTiler.addItemsToBottom(thumbs);
}

export function toggleInfiniteScroll(value: boolean): void {
  SearchPageCreator.toggleInfiniteScroll(value);
}
