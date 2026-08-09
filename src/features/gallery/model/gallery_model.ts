import * as GalleryFavoriter from "@/features/gallery/model/favoriter";
import * as GalleryState from "@/features/gallery/model/state";
import * as Navigator from "@/lib/remote/rule34/posts/navigation";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "@/types/favorite";
import { Boundary } from "@/types/boundary";
import { Cursor } from "@/lib/collection/cursor";
import { ItemWindow } from "@/lib/collection/item_window";
import { NavigationKey } from "@/types/input";
import { Preferences } from "@/app/context/preferences";
import { downloadFromThumb } from "@/lib/remote/rule34/media/download";
import { isVideoThumb } from "@/lib/media/type_predicates";
import { navigationDelta } from "@/utils/navigation";

const cursor = new Cursor<HTMLElement>();
let preloadWindow: ItemWindow<HTMLElement>;

export * from "@/features/gallery/model/state";

export function setup(getItems: () => HTMLElement[], wrapAround: boolean): void {
  preloadWindow = new ItemWindow(getItems, wrapAround);
}

export const getItemsAround = (id: string): HTMLElement[] => preloadWindow.getItemsAround(id);

export const jumpToLast = (): void => cursor.jumpToLast();
export const jumpToFirst = (): void => cursor.jumpToFirst();
export const move = (direction: NavigationKey): Boundary => cursor.move(navigationDelta(direction));
export const currentThumb = (): HTMLElement => cursor.currentItem();
export const pointTo = (thumb: HTMLElement): void => cursor.pointTo(thumb);
export const indexThumbs = (source: HTMLElement[]): void => cursor.indexItems(source);

export const isViewingVideo = (): boolean => GalleryState.isInGallery() && isVideoThumb(cursor.currentItem());
export const openPost = (): void => Navigator.openPost(cursor.currentItem().id);
export const openMedia = (): Promise<void> => Navigator.openMedia(cursor.currentItem());
export const download = (): Promise<void> => downloadFromThumb(cursor.currentItem());
export const addFavorite = (): Promise<AddFavoriteStatus> => GalleryFavoriter.addFavorite(cursor.currentItem());
export const removeFavorite = (): Promise<RemoveFavoriteStatus> => GalleryFavoriter.removeFavorite(cursor.currentItem());
export const currentThumbIfOpen = (): HTMLElement | null => (GalleryState.isInGallery() ? cursor.currentItem() : null);

export function open(thumb: HTMLElement): void {
  cursor.pointTo(thumb);
  GalleryState.open();

  if (Preferences.gallery.previewEnabled.value) {
    Preferences.gallery.previewEnabled.set(false);
  }
}
