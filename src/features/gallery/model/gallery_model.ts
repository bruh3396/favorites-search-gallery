import * as GalleryFavoriteToggler from "./gallery_favorite_toggler";
import * as GalleryStateMachine from "./gallery_state_machine";
import * as GalleryThumbSelector from "./gallery_thumb_selector";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "../../../types/favorite_types";
import { GalleryBoundary, GalleryState } from "../types/gallery_types";
import { openOriginal, openPostPage } from "../../../utils/dom/links";
import { NavigationKey } from "../../../types/common_types";
import { ON_FAVORITES_PAGE } from "../../../lib/global/flags/intrinsic_flags";
import { clamp } from "../../../utils/primitive/number";
import { createPostPageURL } from "../../../lib/api/api_url";
import { downloadFromThumb } from "../../../lib/download/downloader";
import { getAllThumbs } from "../../../utils/dom/dom";
import { getOriginalContentURL } from "../../../lib/api/api_content";
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
  currentIndex = GalleryThumbSelector.getIndexFromThumb(thumb);
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

export function navigate(direction: NavigationKey): GalleryBoundary {
  const nextIndex = isForwardNavigationKey(direction) ? currentIndex + 1 : currentIndex - 1;

  setCurrentIndex(nextIndex);
  return getBoundary(nextIndex);
}

export function navigateRight(): void {
  setCurrentIndex(currentIndex + 1);
}

function getBoundary(index: number): GalleryBoundary {
  if (index < 0) {
    return GalleryBoundary.AT_LEFT_BOUNDARY;
  }

  if (index >= GalleryThumbSelector.getThumbsOnCurrentPage().length) {
    return GalleryBoundary.AT_RIGHT_BOUNDARY;
  }
  return GalleryBoundary.IN_BOUNDS;
}

export function navigateAfterPageChange(direction: NavigationKey): void {
  const nextIndex = isForwardNavigationKey(direction) ? 0 : GalleryThumbSelector.getThumbsOnCurrentPage().length - 1;

  setCurrentIndex(nextIndex);
}

export function navigateToPreviousPage(): void {
  setCurrentIndex(GalleryThumbSelector.getThumbsOnCurrentPage().length - 1);
}

export function navigateToNextPage(): void {
  setCurrentIndex(0);
}

export function getThumbsAround(thumb: HTMLElement): HTMLElement[] {
  if (ON_FAVORITES_PAGE) {
    return GalleryThumbSelector.getFavoritesPageSearchResultsAround(thumb);
  }
  return GalleryThumbSelector.getSearchPageThumbsAround(thumb);
}

export function indexCurrentPageThumbs(): void {
  GalleryThumbSelector.indexCurrentPageThumbs(getAllThumbs());
}

export function clampCurrentIndex(): void {
  currentIndex = clamp(currentIndex, 0, GalleryThumbSelector.getThumbsOnCurrentPage().length - 1);
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

export function addFavoriteInGallery(): Promise<AddFavoriteStatus> {
  return GalleryFavoriteToggler.addFavoriteInGallery(getCurrentThumb());
}

export function removeFavoriteInGallery(): Promise<RemoveFavoriteStatus> {
  return GalleryFavoriteToggler.removeFavoriteInGallery(getCurrentThumb());
}

export async function getLinksFromCurrentThumb(): Promise<{ post: string; image: string }> {
  const thumb = getCurrentThumb();

  if (thumb === undefined) {
    return { post: "", image: "" };
  }
  return { post: createPostPageURL(thumb.id), image: await getOriginalContentURL(thumb) };
}

function setCurrentIndex(value: number): void {
  currentIndex = clamp(value, 0, GalleryThumbSelector.getThumbsOnCurrentPage().length - 1);
}
