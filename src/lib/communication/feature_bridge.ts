import { Favorite } from "../../types/favorite";
import { FeatureChannel } from "./feature_channel";
import { NavigationKey } from "../../types/input";
import { SearchPage } from "../../features/search_page/types/search_page";

export const FeatureBridge = {
  inGallery: new FeatureChannel<void, boolean>(false),
  allFavorites: new FeatureChannel<void, Favorite[]>([]),
  getFavorite: new FeatureChannel<string, Favorite | undefined>(undefined),
  favoritesSearchResults: new FeatureChannel<void, Favorite[]>([]),
  loadMoreFavorites: new FeatureChannel<NavigationKey, void>(undefined),
  favoritesCanExtend: new FeatureChannel<void, boolean>(false),
  navigateToAdjacentSearchPage: new FeatureChannel<NavigationKey, SearchPage | null>(null),
  searchPageThumbs: new FeatureChannel<void, HTMLElement[]>([]),
  currentSearchQuery: new FeatureChannel<void, string>("")
};
