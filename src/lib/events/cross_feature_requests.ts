import { CrossFeatureRequest } from "./cross_feature_request";
import { Favorite } from "../../types/favorite_data_types";
import { NavigationKey } from "../../types/common_types";
import { SearchPage } from "../../types/search_page";

export const CrossFeatureRequests = {
  inGallery: new CrossFeatureRequest<void, boolean>(false),
  loadNewSearchPagesInGallery: new CrossFeatureRequest<NavigationKey, SearchPage | null>(null),
  loadNewFavoritesInGallery: new CrossFeatureRequest<NavigationKey, boolean>(false),
  latestFavoritesSearchResults: new CrossFeatureRequest<void, Favorite[]>([]),
  latestSearchPageThumbs: new CrossFeatureRequest<void, HTMLElement[]>([]),
  getFavorite: new CrossFeatureRequest<string, Favorite | undefined>(undefined)
};
