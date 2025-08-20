import * as GalleryRenderer from "./renderers/gallery_renderer";
import * as GalleryUI from "./ui/gallery_ui";
import * as SearchPageCreator from "./search_page_creator";
import { GALLERY_CONTAINER } from "../ui/gallery_container";
import { RemoveFavoriteStatus } from "../../../types/api/api_types";
import { SearchPage } from "../../../types/search_page";

export function showContentInGallery(thumb: HTMLElement): void {
  display(thumb);
  GalleryUI.updateUIInGallery(thumb);
}

export function display(thumb: HTMLElement): void {
  toggleVisibility(true);
  GalleryRenderer.render(thumb);
  GalleryUI.show();
  GalleryRenderer.toggleZoom(false);
}

export function hide(): void {
  toggleVisibility(false);
  GalleryRenderer.hide();
  GalleryUI.hide();
}

export function enterGallery(thumb: HTMLElement): void {
  GalleryRenderer.render(thumb);
  GalleryUI.enterGallery(thumb);
  toggleVisibility(true);
}

export function exitGallery(): void {
  GalleryRenderer.exitGallery();
  GalleryUI.exitGallery();
  toggleVisibility(false);
  toggleZoomCursor(false);
}

export function toggleVisibility(value: boolean): void {
  GALLERY_CONTAINER.style.display = value ? "" : "none";
}

export function preloadContentOutOfGallery(thumbs: HTMLElement[]): void {
  GalleryRenderer.preloadContentOutOfGallery(thumbs);
}

export function preloadContentInGallery(thumbs: HTMLElement[]): void {
  GalleryRenderer.preloadContentInGallery(thumbs);
}

export function handlePageChange(): void {
  GalleryRenderer.handlePageChange();
}

export function handlePageChangeInGallery(): void {
  GalleryRenderer.handlePageChangeInGallery();
  GalleryUI.scrollToLastVisitedThumb();
}

export function handleMouseMoveInGallery(): void {
  toggleCursor(true);
}

export function toggleBackgroundOpacity(): void {
  GalleryUI.toggleBackgroundOpacity();
}

export function updateBackgroundOpacity(event: WheelEvent): void {
  GalleryUI.updateBackgroundOpacityFromEvent(event);
}

export function showAddedFavoriteStatus(status: number): void {
  GalleryUI.showAddedFavoriteStatus(status);
}

export function showRemovedFavoriteStatus(status: RemoveFavoriteStatus): void {
  GalleryUI.showRemovedFavoriteStatus(status);
}

export function toggleCursor(value: boolean): void {
  GalleryUI.toggleCursor(value);
}

export function toggleVideoLooping(value: boolean): void {
  GalleryRenderer.toggleVideoLooping(value);
}

export function restartVideo(): void {
  GalleryRenderer.restartVideo();
}

export function createSearchPage(searchPage: SearchPage): void {
  SearchPageCreator.createSearchPage(searchPage);
}

export function toggleVideoPause(): void {
  GalleryRenderer.toggleVideoPause();
}

export function toggleVideoMute(): void {
  GalleryRenderer.toggleVideoMute();
}

export function handleResultsAddedToCurrentPage(thumbs: HTMLElement[]): void {
  GalleryRenderer.handleResultsAddedToCurrentPage(thumbs);
}

export function toggleZoomCursor(value: boolean): void {
  GalleryUI.toggleZoomCursor(value);
  GalleryRenderer.toggleZoomCursor(value);
}

export function toggleZoom(value: boolean | undefined = undefined): boolean {
  return GalleryRenderer.toggleZoom(value);
}

export function zoomToPoint(x: number, y: number): void {
  GalleryRenderer.zoomToPoint(x, y);
}

export function correctOrientation(): void {
  GalleryRenderer.correctOrientation();
}

export function setupGalleryView(): void {
  GalleryUI.setupGalleryUI();
  SearchPageCreator.setupSearchPageCreator();
}
