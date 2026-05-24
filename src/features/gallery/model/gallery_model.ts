import * as GalleryCursor from "./cursor";
import * as GalleryFavoriter from "./favoriter";
import * as GalleryState from "./gallery_state";
import * as Navigator from "../../../lib/remote/rule34/navigator";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "../../../types/favorite";
import { downloadFromThumb } from "../../../lib/remote/rule34/media_downloader";
import { isVideo } from "../../../lib/media/media_type_guards";

export * from "./gallery_state";
export * from "./cursor";
export * from "./neighbors";

export const isViewingVideo = (): boolean => GalleryState.isInGallery() && isVideo(GalleryCursor.currentThumb());
export const openPost = (): void => Navigator.openPost(GalleryCursor.currentThumb().id);
export const openMedia = (): Promise<void> => Navigator.openMedia(GalleryCursor.currentThumb());
export const download = (): Promise<void> => downloadFromThumb(GalleryCursor.currentThumb());
export const addFavorite = (): Promise<AddFavoriteStatus> => GalleryFavoriter.addFavorite(GalleryCursor.currentThumb());
export const removeFavorite = (): Promise<RemoveFavoriteStatus> => GalleryFavoriter.removeFavorite(GalleryCursor.currentThumb());

export function open(thumb: HTMLElement): void {
  GalleryCursor.pointTo(thumb);
  GalleryState.open();
}
