import * as GalleryCursor from "./cursor";
import * as GalleryFavoriter from "./favoriter";
import * as GalleryState from "./gallery_state";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "../../../types/favorite";
import { openMedia, openPost } from "../../../lib/navigator";
import { downloadFromThumb } from "../../../lib/remote/rule34/media_downloader";
import { isVideo } from "../../../lib/media/media_type_guards";

export * from "./gallery_state";
export * from "./cursor";
export * from "./neighbors";

export const isVideoSelected = (): boolean => GalleryState.isInGallery() && isVideo(GalleryCursor.getSelectedThumb());
export const openSelectedPost = (): void => openPost(GalleryCursor.getSelectedThumb().id);
export const openSelectedMedia = (): Promise<void> => openMedia(GalleryCursor.getSelectedThumb());
export const downloadSelected = (): Promise<void> => downloadFromThumb(GalleryCursor.getSelectedThumb());
export const favoriteSelected = (): Promise<AddFavoriteStatus> => GalleryFavoriter.addFavorite(GalleryCursor.getSelectedThumb());
export const unFavoriteSelected = (): Promise<RemoveFavoriteStatus> => GalleryFavoriter.removeFavorite(GalleryCursor.getSelectedThumb());

export function enterGallery(thumb: HTMLElement): void {
  GalleryCursor.setCurrentThumb(thumb);
  GalleryState.enterGallery();
}
