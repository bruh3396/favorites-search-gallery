import * as ContentTiler from "../../../app/shell/content_tiler";
import * as SearchPageCreator from "./page_builder";
import { Preferences } from "../../../app/state/preferences";
import { SearchPage } from "../types/search_page";
import { getAllPageThumbs } from "../../../app/shell/content_thumbs";
import { hideUnusedLayoutSizer } from "../../../app/shell/content_tiler";

export function setup(): void {
  ContentTiler.setup();
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

export function currentSearch(): string {
  return (document.querySelector("input[name=\"tags\"]") as HTMLInputElement)?.value ?? "";
}
