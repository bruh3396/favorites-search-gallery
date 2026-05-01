import { Favorite } from "../../types/favorite";
import { FeatureQuery } from "./feature_query";
import { NavigationKey } from "../../types/input";
import { SearchPage } from "../../features/search_page/model/search_page";

export const FeatureBridge = {
  inGallery: new FeatureQuery<void, boolean>(false),
  allFavorites: new FeatureQuery<string, Favorite | undefined>(undefined),
  favoritesSearchResults: new FeatureQuery<void, Favorite[]>([]),
  moreFavoritesPagesExist: new FeatureQuery<NavigationKey, boolean>(false),
  moreSearchPagesExist: new FeatureQuery<NavigationKey, SearchPage | null>(null),
  searchPageItems: new FeatureQuery<void, HTMLElement[]>([])
};
