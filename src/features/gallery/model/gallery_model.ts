import * as GalleryStateMachine from "./state_machine";
import * as GalleryThumbSelector from "./thumb_selector";
import { openOriginal, openPostPage } from "../../../lib/navigator";
import { GalleryBoundary } from "../types/gallery_types";
import { NavigationKey } from "../../../types/input";
import { ON_FAVORITES_PAGE } from "../../../lib/environment/environment";
import { clamp } from "../../../utils/number";
import { downloadFromThumb } from "../../../lib/remote/rule34/media_downloader";
import { isForwardNavigationKey } from "../../../types/guards";
import { isVideo } from "../../../lib/media/media_type_guards";

export * from "./state_machine";
export { addFavorite, removeFavorite } from "./favorite_toggler";

let currentIndex = 0;

export function getCurrentThumb(): HTMLElement {
  return GalleryThumbSelector.getThumbsOnCurrentPage()[currentIndex];
}

export function isViewingVideo(): boolean {
  return GalleryStateMachine.inGallery() && isVideo(getCurrentThumb());
}

export function enterGallery(thumb: HTMLElement): void {
  currentIndex = GalleryThumbSelector.getIndexFromThumb(thumb);
  GalleryStateMachine.enterGallery();
}

export function navigate(direction: NavigationKey): GalleryBoundary {
  return setCurrentIndex(isForwardNavigationKey(direction) ? currentIndex + 1 : currentIndex - 1);
}

export function navigateAfterPageChange(direction: NavigationKey): void {
  setCurrentIndex(isForwardNavigationKey(direction) ? 0 : getLastIndex());
}

export function navigateToPreviousPage(): void {
  setCurrentIndex(getLastIndex());
}

export function navigateToNextPage(): void {
  setCurrentIndex(0);
}

export const getThumbsAround = ON_FAVORITES_PAGE ? GalleryThumbSelector.getFavoritesPageSearchResultsAround : GalleryThumbSelector.getSearchPageThumbsAround;

export function indexCurrentPageThumbs(): void {
  GalleryThumbSelector.indexCurrentPageThumbs();
}

export function clampCurrentIndex(): void {
  currentIndex = clamp(currentIndex, 0, getLastIndex());
}

export function openPostInNewTab(): void {
  openPostPage(getCurrentThumb().id);
}

export function openOriginalInNewTab(): void {
  openOriginal(getCurrentThumb());
}

export function downloadInGallery(): void {
  downloadFromThumb(getCurrentThumb());
}

function setCurrentIndex(nextIndex: number): GalleryBoundary {
  currentIndex = clamp(nextIndex, 0, getLastIndex());
  return GalleryThumbSelector.getBoundary(nextIndex);
}

function getLastIndex(): number {
  return GalleryThumbSelector.getThumbsOnCurrentPage().length - 1;
}
