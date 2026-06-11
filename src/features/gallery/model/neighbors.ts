import { getElementsAroundIndex, getWrappedElementsAroundIndex } from "@/utils/collection/array";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { ON_FAVORITES_PAGE } from "@/lib/environment";

export const getThumbsAround = ON_FAVORITES_PAGE ? getFavoritesThumbsAround : getPostListThumbsAround;

function getFavoritesThumbsAround(thumb: HTMLElement | undefined, limit: number = 50): HTMLElement[] {
  if (thumb === undefined) {
    return [];
  }
  const searchResults = FeatureBridge.favoritesSearchResults.call();
  const startIndex = searchResults.findIndex(favorite => favorite.id === thumb.id);
  const adjacentResults = getWrappedElementsAroundIndex(searchResults, startIndex, limit);
  return adjacentResults.map(favorite => favorite.root);
}

function getPostListThumbsAround(thumb: HTMLElement | undefined, limit: number = 50): HTMLElement[] {
  if (thumb === undefined) {
    return [];
  }
  const thumbs = FeatureBridge.postListThumbs.call();
  const index = thumbs.findIndex(postListThumb => postListThumb.id === thumb.id);
  return index === -1 ? [] : getElementsAroundIndex(thumbs, index, limit);
}
