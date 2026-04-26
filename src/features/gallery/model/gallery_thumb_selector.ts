import { getElementsAroundIndex, getWrappedElementsAroundIndex } from "../../../utils/primitives/array";
import { isImage, isVideo } from "../../../utils/content/content_classifier";
import { CrossFeatureRequests } from "../../../lib/communication/cross_feature_requests";
import { Favorite } from "../../../types/favorite_data_types";
import { GalleryBoundary } from "../types/gallery_types";
import { GallerySettings } from "../../../config/gallery_settings";
import { getAllThumbs } from "../../../utils/dom/dom";
import { removeNonNumericCharacters } from "../../../utils/string/parse";

let thumbsOnCurrentPage: HTMLElement[] = [];
const enumeratedThumbs: Map<string, number> = new Map();

export function getThumbsOnCurrentPage(): HTMLElement[] {
  return thumbsOnCurrentPage;
}

export function indexCurrentPageThumbs(): void {
  thumbsOnCurrentPage = getAllThumbs();
  enumerateCurrentPageThumbs();
}

function enumerateCurrentPageThumbs(): void {
  for (let i = 0; i < thumbsOnCurrentPage.length; i += 1) {
    enumeratedThumbs.set(removeNonNumericCharacters(thumbsOnCurrentPage[i].id), i);
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
  const searchResults = CrossFeatureRequests.latestFavoritesSearchResults.request();
  const startIndex = searchResults.findIndex(favorite => favorite.id === initialThumb.id);
  const adjacentSearchResults = getWrappedElementsAroundIndex(searchResults, startIndex, 50).filter(thumb => qualifier(thumb)).slice(0, limit);
  return adjacentSearchResults.map(favorite => favorite.root);
}

export function getFavoritesPageSearchResultsAround(thumb: HTMLElement, limit: number = 50): HTMLElement[] {
  const latestFavoritesPageSearchResults = CrossFeatureRequests.latestFavoritesSearchResults.request();
  const startIndex = latestFavoritesPageSearchResults.findIndex(post => post.id === thumb.id);
  const adjacentSearchResults = getWrappedElementsAroundIndex(latestFavoritesPageSearchResults, startIndex, limit);
  return adjacentSearchResults.map(favorite => favorite.root);
}

export function getSearchPageThumbsAround(thumb: HTMLElement): HTMLElement[] {
  const latestSearchPageThumbs = CrossFeatureRequests.latestSearchPageThumbs.request();
  const index = latestSearchPageThumbs.findIndex(t => t.id === thumb.id);

  if (index === -1) {
    return [];
  }
  return getElementsAroundIndex(latestSearchPageThumbs, index, 100);
}

export function getBoundary(index: number): GalleryBoundary {
    if (index < 0) {
    return GalleryBoundary.AT_LEFT_BOUNDARY;
  }

  if (index >= thumbsOnCurrentPage.length) {
    return GalleryBoundary.AT_RIGHT_BOUNDARY;
  }
  return GalleryBoundary.IN_BOUNDS;
}
