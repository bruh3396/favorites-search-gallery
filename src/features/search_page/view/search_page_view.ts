import * as ContentTiler from "../../../app/layout/content_tiler";
import * as SearchPageShell from "./shell/shell";
import { markAsFavorite, unmarkAsFavorite } from "../dom_tweaks/favorite_indicator";
import { getAllPageThumbs } from "../../../app/layout/content_thumbs";

export { render as renderSearchPage } from "./search_page_renderer";
export { addToBottom as insertNewSearchResults } from "../../../app/layout/content_tiler";
export { setInfiniteScrollStyle } from "../dom_tweaks/infinite_scroll_style";
export { setFavoriteIndicatorLoading, markAsFavorite, markAsFavoriteById, unmarkAsFavorite, applyCurrentFavoriteStyle, applyGalleryFavoriteStyle, setFavoriteIndicatorSubOptionsVisible } from "../dom_tweaks/favorite_indicator";

export function setup(): Promise<void> {
  ContentTiler.setup();
  ContentTiler.tile(getAllPageThumbs());
  return SearchPageShell.create();
}

export function currentSearch(): string {
  return (document.querySelector("input[name=\"tags\"]") as HTMLInputElement)?.value ?? "";
}

export function markAsFavorites(thumbs: HTMLElement[]): void {
  thumbs.forEach(thumb => markAsFavorite(thumb));
}

export function unmarkAsFavorites(thumbs: HTMLElement[]): void {
  thumbs.forEach(thumb => unmarkAsFavorite(thumb));
}
