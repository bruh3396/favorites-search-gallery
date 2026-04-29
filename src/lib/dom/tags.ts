import { Favorite } from "../../types/favorite";
import { FeatureBridge } from "../communication/features/feature_bridge";
import { ON_FAVORITES_PAGE } from "../environment/environment";
import { convertToTagSet } from "../../utils/string/tags";
import { getImageFromThumb } from "./thumb";

function resolveTagAttribute(image: HTMLImageElement): string {
  return image.hasAttribute("tags") ? "tags" : "title";
}

function getRawTagsFromSearchPageItem(thumb: HTMLElement | Favorite): string {
  if (!(thumb instanceof HTMLElement)) {
    return "";
  }
  const image = getImageFromThumb(thumb);

  if (image === null) {
    return "";
  }
  const tagAttribute = resolveTagAttribute(image);
  return image.getAttribute(tagAttribute) || "";
}

function getTagSetFromSearchPageItem(thumb: HTMLElement | Favorite): Set<string> {
  return convertToTagSet(getRawTagsFromSearchPageItem(thumb));
}

function getTagSetFromFavoritesPageItem(item: HTMLElement | Favorite): Set<string> {
  const favorite = FeatureBridge.allFavorites.query(item.id);
  return favorite === undefined ? new Set() : new Set(favorite.tags);
}

export const getTagSetFromItem: (item: HTMLElement | Favorite) => Set<string> = ON_FAVORITES_PAGE ? getTagSetFromFavoritesPageItem : getTagSetFromSearchPageItem;
