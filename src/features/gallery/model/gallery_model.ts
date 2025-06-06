import * as GalleryStateMachine from "./gallery_state_machine";
import * as ThumbSelector from "./gallery/gallery_thumb_selector";
import { openOriginal, openPostPage } from "../../../utils/dom/links";
import { Favorite } from "../../../types/interfaces/interfaces";
import { GalleryState } from "../types/gallery_types";
import { NavigationKey } from "../../../types/primitives/primitives";
import { ON_FAVORITES_PAGE } from "../../../lib/globals/flags";
import { clamp } from "../../../utils/primitive/number";
import { downloadFromThumb } from "../../../lib/download/downloader";
import { getAllThumbs } from "../../../utils/dom/dom";
import { isForwardNavigationKey } from "../../../types/primitives/equivalence";
import { isVideo } from "../../../utils/content/content_type";

let currentIndex = 0;
let recentlyExitedGallery = false;

export function hasRecentlyExitedGallery(): boolean {
  return recentlyExitedGallery;
}

export function getCurrentThumb(): HTMLElement | undefined {
  return ThumbSelector.getThumbsOnCurrentPage()[currentIndex];
}

export function getCurrentState(): GalleryState {
  return GalleryStateMachine.getCurrentState();
}

export function inGallery(): boolean {
  return GalleryStateMachine.getCurrentState() === GalleryState.IN_GALLERY;
}

export function showOnHoverEnabled(): boolean {
  return GalleryStateMachine.getCurrentState() === GalleryState.SHOWING_CONTENT_ON_HOVER;
}

export function isViewingVideo(): boolean {
  if (GalleryStateMachine.getCurrentState() !== GalleryState.IN_GALLERY) {
    return false;
  }
  const currentThumb = getCurrentThumb();
  return currentThumb !== undefined && isVideo(currentThumb);
}
export function enterGallery(thumb: HTMLElement): void {
  currentIndex = ThumbSelector.getIndexFromThumb(thumb);
  GalleryStateMachine.changeState(GalleryState.IN_GALLERY);
}

export function exitGallery(): void {
  GalleryStateMachine.changeState(GalleryState.IDLE);
  recentlyExitedGallery = true;
  setTimeout(() => {
    recentlyExitedGallery = false;
  }, 500);
}

export function showContentOnHover(): void {
  GalleryStateMachine.changeState(GalleryState.SHOWING_CONTENT_ON_HOVER);
}

export function toggleShowContentOnHover(): void {
  if (GalleryStateMachine.getCurrentState() === GalleryState.SHOWING_CONTENT_ON_HOVER) {
    GalleryStateMachine.changeState(GalleryState.IDLE);
    return;
  }
  GalleryStateMachine.changeState(GalleryState.SHOWING_CONTENT_ON_HOVER);
}

export function navigate(direction: NavigationKey): HTMLElement | undefined {
  preloadSearchPages();
  currentIndex += isForwardNavigationKey(direction) ? 1 : -1;
  return getCurrentThumb();
}

export function navigateAfterPageChange(direction: NavigationKey): HTMLElement | undefined {
  currentIndex = isForwardNavigationKey(direction) ? 0 : ThumbSelector.getThumbsOnCurrentPage().length - 1;
  return getCurrentThumb();
}

export function getSearchResults(): Favorite[] {
  return ThumbSelector.getLatestSearchResults();
}

export function getThumbsAround(thumb: HTMLElement): HTMLElement[] {
  if (ON_FAVORITES_PAGE) {
    return ThumbSelector.getSearchResultsAround(thumb);
  }
  return [];
  // return this.searchPageLoader.getThumbsAround(thumb);
}

export function setSearchResults(searchResults: Favorite[]): void {
  ThumbSelector.setLatestSearchResults(searchResults);
}

export function indexCurrentPageThumbs(): void {
  ThumbSelector.indexCurrentPageThumbs(getAllThumbs());
}

export function preloadSearchPages(): void {
  // searchPageLoader.preloadSearchPages();
}

export function clampCurrentIndex(): void {
  currentIndex = clamp(currentIndex, 0, ThumbSelector.getThumbsOnCurrentPage().length - 1);
}

export function navigateSearchPages(direction: NavigationKey): SearchPage | null {
  // return this.searchPageLoader.navigateSearchPages(direction);
}

export function openPostInNewTab(): void {
  const currentThumb = getCurrentThumb();

  if (currentThumb !== undefined) {
    openPostPage(currentThumb.id);
  }
}

export function openOriginalInNewTab(): void {
  const currentThumb = getCurrentThumb();

  if (currentThumb !== undefined) {
    openOriginal(currentThumb);
  }
}

export function downloadInGallery(): void {
  const currentThumb = getCurrentThumb();

  if (currentThumb !== undefined) {
    downloadFromThumb(currentThumb);
  }
}
