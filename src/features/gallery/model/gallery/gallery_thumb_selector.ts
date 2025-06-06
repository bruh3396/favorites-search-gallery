import { isImage, isVideo } from "../../../../utils/content/content_type";
import { Favorite } from "../../../../types/interfaces/interfaces";
import { GallerySettings } from "../../../../config/gallery_settings";
import { getWrappedElementsAroundIndex } from "../../../../utils/collection/array";

let latestSearchResults: Favorite[] = [];
let thumbsOnCurrentPage: HTMLElement[] = [];
const enumeratedThumbs: Map<string, number> = new Map();

export function getThumbsOnCurrentPage(): HTMLElement[] {
  return thumbsOnCurrentPage;
}

export function getLatestSearchResults(): Favorite[] {
  return latestSearchResults;
}

export function indexCurrentPageThumbs(thumbs: HTMLElement[]): void {
  thumbsOnCurrentPage = thumbs;
  enumerateCurrentPageThumbs();
}

export function setLatestSearchResults(searchResults: Favorite[]): void {
  latestSearchResults = searchResults;
}

function enumerateCurrentPageThumbs(): void {
  for (let i = 0; i < thumbsOnCurrentPage.length; i += 1) {
    enumeratedThumbs.set(thumbsOnCurrentPage[i].id, i);
  }
}

export function getIndexFromThumb(thumb: HTMLElement): number {
  return enumeratedThumbs.get(thumb.id) ?? 0;
}

export function getImageThumbsAroundOnCurrentPage(initialThumb: HTMLElement): HTMLElement[] {
  return getThumbsAroundWrappedOnCurrentPage(
    initialThumb,
    GallerySettings.maxImagesToRenderAroundInGallery,
    (thumb: HTMLElement): boolean => {
      return isImage(thumb);
    }
  );
}

export function getImageThumbsAroundThroughoutAllPages(initialThumb: HTMLElement): HTMLElement[] {
  return getThumbsAroundThroughoutAllPages(
    initialThumb,
    GallerySettings.maxImagesToRenderAroundInGallery,
    (object: HTMLElement | Favorite) => {
      return isImage(object);
    }
  );
}

export function getThumbsAroundOnCurrentPage(initialThumb: HTMLElement): HTMLElement[] {
  return getThumbsAroundWrappedOnCurrentPage(
    initialThumb,
    GallerySettings.maxImagesToRenderAroundInGallery,
    () => {
      return true;
    }
  );
}

export function getVideoThumbsAroundOnCurrentPage(initialThumb: HTMLElement, limit: number): HTMLElement[] {
  return getThumbsAroundWrappedOnCurrentPage(
    initialThumb,
    limit,
    (thumb: HTMLElement) => {
      return isVideo(thumb) && thumb.id !== initialThumb.id;
    }
  );
}

export function getVideoThumbsAroundThroughoutAllPages(initialThumb: HTMLElement, limit: number): HTMLElement[] {
  return getThumbsAroundThroughoutAllPages(
    initialThumb,
    limit,
    (favorite: Favorite) => {
      return isVideo(favorite) && favorite.id !== initialThumb.id;
    }
  );
}

function getThumbsAroundWrappedOnCurrentPage(initialThumb: HTMLElement, limit: number, qualifier: (thumb: HTMLElement) => boolean): HTMLElement[] {
  const startIndex = thumbsOnCurrentPage.findIndex(thumb => thumb.id === initialThumb.id);
  return getWrappedElementsAroundIndex(thumbsOnCurrentPage, startIndex, 100)
    .filter(thumb => qualifier(thumb))
    .slice(0, limit);
}

function getThumbsAroundThroughoutAllPages(initialThumb: HTMLElement, limit: number, qualifier: (favorite: Favorite) => boolean): HTMLElement[] {
  const startIndex = latestSearchResults.findIndex(favorite => favorite.id === initialThumb.id);
  const adjacentSearchResults = getWrappedElementsAroundIndex(latestSearchResults, startIndex, 50)
    .filter(thumb => qualifier(thumb))
    .slice(0, limit);
  return adjacentSearchResults.map(favorite => favorite.root);
}

export function getSearchResultsAround(thumb: HTMLElement, limit: number = 50): HTMLElement[] {
  const startIndex = latestSearchResults.findIndex(post => post.id === thumb.id);
  const adjacentSearchResults = getWrappedElementsAroundIndex(latestSearchResults, startIndex, limit);
  return adjacentSearchResults.map(favorite => favorite.root);
}
