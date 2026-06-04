import * as ContentTiler from "@/app/layout/content_tiler";
import * as SearchPageShell from "@/features/search_page/view/shell/shell";
import { markAsFavorite, unmarkAsFavorite } from "@/features/search_page/dom_tweaks/favorite_indicator";
import { getAllPageThumbs } from "@/app/layout/content_thumbs";

export { render as renderSearchPage } from "@/features/search_page/view/search_page_renderer";
export { addToBottom as insertNewSearchResults } from "@/app/layout/content_tiler";
export { setInfiniteScrollStyle } from "@/features/search_page/dom_tweaks/infinite_scroll_style";
export { setFavoriteIndicatorLoading, markAsFavorite, markAsFavoriteById, unmarkAsFavorite, applyCurrentFavoriteStyle, applyGalleryFavoriteStyle, setFavoriteIndicatorSubOptionsVisible } from "@/features/search_page/dom_tweaks/favorite_indicator";

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
