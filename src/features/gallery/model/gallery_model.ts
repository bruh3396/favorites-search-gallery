import * as GalleryStateMachine from "./gallery_state_machine";
import * as GalleryThumbSelector from "./gallery_thumb_selector";
import { GalleryBoundary, GalleryState } from "../types/gallery_types";
import { openOriginal, openPostPage } from "../../../utils/dom/links";
import { NavigationKey } from "../../../types/common_types";
import { ON_FAVORITES_PAGE } from "../../../lib/global/flags/intrinsic_flags";
import { clamp } from "../../../utils/primitive/number";
import { downloadFromThumb } from "../../../lib/download/downloader";
import { isForwardNavigationKey } from "../../../types/equivalence";
import { isVideo } from "../../../utils/content/content_type";

let currentIndex = 0;
let recentlyExitedGallery = false;

export function hasRecentlyExitedGallery(): boolean {
  return recentlyExitedGallery;
}

export function getCurrentThumb(): HTMLElement {
  return GalleryThumbSelector.getThumbsOnCurrentPage()[currentIndex];
}

export function getCurrentState(): GalleryState {
  return GalleryStateMachine.getCurrentState();
}

export function inGallery(): boolean {
  return GalleryStateMachine.getCurrentState() === GalleryState.IN_GALLERY;
}

export function showingContentOnHover(): boolean {
  return GalleryStateMachine.getCurrentState() === GalleryState.SHOWING_CONTENT_ON_HOVER;
}

export function isViewingVideo(): boolean {
  return inGallery() && isVideo(getCurrentThumb());
}

export function enterGallery(thumb: HTMLElement): void {
  currentIndex = GalleryThumbSelector.getIndexFromThumb(thumb);
  GalleryStateMachine.changeState(GalleryState.IN_GALLERY);
}

export function exitGallery(): void {
  GalleryStateMachine.changeState(GalleryState.IDLE);
  setRecentlyExitedGallery();
}

function setRecentlyExitedGallery(): void {
  recentlyExitedGallery = true;
  setTimeout(() => {
    recentlyExitedGallery = false;
  }, 500);
}

export function toggleShowingContentOnHover(): void {
  GalleryStateMachine.changeState(GalleryStateMachine.getCurrentState() === GalleryState.SHOWING_CONTENT_ON_HOVER ? GalleryState.IDLE : GalleryState.SHOWING_CONTENT_ON_HOVER);
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
