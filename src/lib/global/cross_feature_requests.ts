import { CrossFeatureRequest } from "../components/cross_feature_request";
import { FavoriteItem } from "../../features/favorites/types/favorite/favorite_item";
import { NavigationKey } from "../../types/common_types";
import { SearchPage } from "../../types/search_page";

export const CrossFeatureRequests = {
  inGallery: new CrossFeatureRequest<void, boolean>(false),
  loadNewSearchPagesInGallery: new CrossFeatureRequest<NavigationKey, SearchPage | null>(null),
  loadNewFavoritesInGallery: new CrossFeatureRequest<NavigationKey, boolean>(false),
  latestFavoritesSearchResults: new CrossFeatureRequest<void, FavoriteItem[]>([]),
  latestSearchPageThumbs: new CrossFeatureRequest<void, HTMLElement[]>([])
};
