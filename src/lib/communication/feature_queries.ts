import { Favorite } from "../../types/favorite";
import { FeatureQuery } from "./feature_query";
import { NavigationKey } from "../../types/input";
import { SearchPage } from "../../features/search_page/types/search_page";

export const FeatureQueries = {
  inGallery: new FeatureQuery<void, boolean>(false),
  allFavorites: new FeatureQuery<void, Favorite[]>([]),
  getFavorite: new FeatureQuery<string, Favorite | undefined>(undefined),
  favoritesSearchResults: new FeatureQuery<void, Favorite[]>([]),
  moreFavoritesPagesExist: new FeatureQuery<NavigationKey, boolean>(false),
  moreSearchPagesExist: new FeatureQuery<NavigationKey, SearchPage | null>(null),
  searchPageItems: new FeatureQuery<void, HTMLElement[]>([])
};
