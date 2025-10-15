import * as GalleryFavoriteToggler from "./gallery_favorite_toggler";
import * as GalleryStateMachine from "./gallery_state_machine";
import * as GalleryThumbSelector from "./gallery_thumb_selector";
import { AddFavoriteStatus, Favorite, RemoveFavoriteStatus } from "../../../types/favorite_types";
import { openOriginal, openPostPage } from "../../../utils/dom/links";
import { GalleryState } from "../types/gallery_types";
import { NavigationKey } from "../../../types/common_types";
import { ON_FAVORITES_PAGE } from "../../../lib/global/flags/intrinsic_flags";
import { SearchPage } from "../../search_page/types/search_page";
import { clamp } from "../../../utils/primitive/number";
import { createPostPageURL } from "../../../lib/api/api_url";
import { downloadFromThumb } from "../../../lib/download/downloader";
import { getAllThumbs } from "../../../utils/dom/dom";
import { getOriginalContentURL } from "../../../lib/api/media_api";
import { isForwardNavigationKey } from "../../../types/equivalence";
import { isVideo } from "../../../utils/content/content_type";

let currentIndex = 0;
let recentlyExitedGallery = false;
let currentSearchPage: SearchPage | null = null;

export function hasRecentlyExitedGallery(): boolean {
  return recentlyExitedGallery;
}

export function getCurrentThumb(): HTMLElement | undefined {
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

export function navigate(direction: NavigationKey): HTMLElement | undefined {
  currentIndex += isForwardNavigationKey(direction) ? 1 : -1;
  return getCurrentThumb();
}

export function navigateAfterPageChange(direction: NavigationKey): HTMLElement | undefined {
  currentIndex = isForwardNavigationKey(direction) ? 0 : GalleryThumbSelector.getThumbsOnCurrentPage().length - 1;
  return getCurrentThumb();
}

export function getSearchResults(): Favorite[] {
  return GalleryThumbSelector.getLatestSearchResults();
}

export function getThumbsAround(thumb: HTMLElement): HTMLElement[] {
  if (ON_FAVORITES_PAGE) {
    return GalleryThumbSelector.getFavoritesPageSearchResultsAround(thumb);
  }
  return GalleryThumbSelector.getSearchPageThumbsAround(thumb);
}

export function updateFavoritesPageSearchResults(searchResults: Favorite[]): void {
  GalleryThumbSelector.updateFavoritesPageSearchResults(searchResults);
}

export function updateSearchPageThumbs(thumbs: HTMLElement[]): void {
  GalleryThumbSelector.updateSearchPageThumbs(thumbs);
}

export function updateCurrentSearchPage(searchPage: SearchPage | null): void {
  currentSearchPage = searchPage;
}

export function indexCurrentPageThumbs(): void {
  GalleryThumbSelector.indexCurrentPageThumbs(getAllThumbs());
}

export function clampCurrentIndex(): void {
  currentIndex = clamp(currentIndex, 0, GalleryThumbSelector.getThumbsOnCurrentPage().length - 1);
}

export function getCurrentSearchPage(): SearchPage | null {
  return currentSearchPage;
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
