import * as Actions from "@/lib/remote/actions";
import * as GalleryState from "@/features/gallery/model/state";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "@/types/favorite";
import { addFavoriteFromThumb, removeFavoriteFromThumb } from "@/lib/thumb/favorite_actions";
import { Boundary } from "@/types/boundary";
import { Carousel } from "@/lib/collection/carousel";
import { NavigationKey } from "@/types/input";
import { downloadFromThumb } from "@/lib/media/download";
import { isVideoThumb } from "@/lib/thumb/media_item";
import { navigationDelta } from "@/utils/pure/number";

const cursor = new Carousel<HTMLElement>();
let preloadThumbsAround: (id: string) => HTMLElement[] = () => [];

export { getCurrentState, isInGallery, isShowingPreviews, close, preview } from "@/features/gallery/model/state";
export { wrappingThumbsAroundId, clampedThumbsAroundId } from "@/features/gallery/model/item_window";

export function setup(thumbsAround: (id: string) => HTMLElement[]): void {
  preloadThumbsAround = thumbsAround;
}

export const getItemsAround = (id: string): HTMLElement[] => preloadThumbsAround(id);
export const jumpToLast = (): void => cursor.jumpToLast();
export const jumpToFirst = (): void => cursor.jumpToFirst();
export const move = (direction: NavigationKey): Boundary => cursor.move(navigationDelta(direction));
export const currentThumb = (): HTMLElement => cursor.currentItem();
export const pointTo = (thumb: HTMLElement): void => cursor.pointTo(thumb);
export const indexThumbs = (source: HTMLElement[]): void => cursor.indexItems(source);
export const isViewingVideo = (): boolean => GalleryState.isInGallery() && isVideoThumb(cursor.currentItem());
export const openPost = (): void => Actions.openPost(cursor.currentItem().id);
export const openMedia = (): Promise<void> => Actions.openMedia(cursor.currentItem());
export const download = (): Promise<void> => downloadFromThumb(cursor.currentItem());
export const addFavorite = (): Promise<AddFavoriteStatus> => addFavoriteFromThumb(cursor.currentItem());
export const removeFavorite = (): Promise<RemoveFavoriteStatus> => removeFavoriteFromThumb(cursor.currentItem());
export const currentThumbIfOpen = (): HTMLElement | null => (GalleryState.isInGallery() ? cursor.currentItem() : null);

export function open(thumb: HTMLElement): void {
  cursor.pointTo(thumb);
  GalleryState.open();
}
