import * as ContentTiler from "@/app/layout/content_tiler";
import * as PostListNavigatorShell from "@/features/post_list_navigator/view/shell/shell";
import { markAsFavorite, unmarkAsFavorite } from "@/features/post_list_navigator/dom_tweaks/favorite_indicator";
import { ITEM_SELECTOR } from "@/lib/thumb/selectors";
import { getAllPageThumbs } from "@/app/layout/content_thumbs";
import { preparePostListThumbs } from "@/features/post_list_navigator/dom_tweaks/thumb_preparer";

export { render as renderPostList } from "@/features/post_list_navigator/view/renderer";
export { addToBottom as insertNewSearchResults } from "@/app/layout/content_tiler";
export { setInfiniteScrollStyle } from "@/features/post_list_navigator/dom_tweaks/infinite_scroll_style";
export { setFavoriteIndicatorLoading, markAsFavorite, markAsFavoriteById, unmarkAsFavorite } from "@/features/post_list_navigator/dom_tweaks/favorite_indicator";

export function setup(): void {
  ContentTiler.setup();
  PostListNavigatorShell.build();
}

export const tileNativePostListThumbs = (): void => ContentTiler.tile(getAllPageThumbs());
export const removeNativeImageList = (): void => document.querySelector(".image-list")?.replaceChildren();
export const prepareNativePostListThumbs = (): HTMLElement[] => preparePostListThumbs(Array.from(document.querySelectorAll(ITEM_SELECTOR)));
export const currentSearch = (): string => (document.querySelector("input[name=\"tags\"]") as HTMLInputElement)?.value ?? "";
export const markAsFavorites = (thumbs: HTMLElement[]): void => thumbs.forEach(thumb => markAsFavorite(thumb));
export const unmarkAsFavorites = (thumbs: HTMLElement[]): void => thumbs.forEach(thumb => unmarkAsFavorite(thumb));
