import * as ContentTiler from "@/app/layout/content_tiler";
import * as PostListNavigatorShell from "@/features/post_list_navigator/view/shell/shell";
import { markAsFavorite, unmarkAsFavorite } from "@/features/post_list_navigator/dom_tweaks/favorite_indicator";
import { getAllPageThumbs } from "@/app/layout/content_thumbs";

export { render as renderPostList } from "@/features/post_list_navigator/view/renderer";
export { addToBottom as insertNewSearchResults } from "@/app/layout/content_tiler";
export { setInfiniteScrollStyle } from "@/features/post_list_navigator/dom_tweaks/infinite_scroll_style";
export { setFavoriteIndicatorLoading, markAsFavorite, markAsFavoriteById, unmarkAsFavorite, applyCurrentFavoriteStyle, applyGalleryFavoriteStyle, setFavoriteIndicatorSubOptionsVisible } from "@/features/post_list_navigator/dom_tweaks/favorite_indicator";

export function setup(): Promise<void> {
  ContentTiler.setup();
  ContentTiler.tile(getAllPageThumbs());
  return PostListNavigatorShell.create();
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
