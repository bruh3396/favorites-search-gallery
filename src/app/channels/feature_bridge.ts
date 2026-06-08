import { Favorite } from "@/types/favorite";
import { FeatureChannel } from "@/lib/communication/feature_channel";
import { GalleryState } from "@/types/ui";
import { NavigationKey } from "@/types/input";
import { SearchPage } from "@/features/search_page/types/search_page";

export const FeatureBridge = {
  galleryState: new FeatureChannel<void, GalleryState>(GalleryState.Idle),
  allFavorites: new FeatureChannel<void, Favorite[]>([]),
  getFavorite: new FeatureChannel<string, Favorite | undefined>(undefined),
  favoritesSearchResults: new FeatureChannel<void, Favorite[]>([]),
  loadMoreFavorites: new FeatureChannel<NavigationKey, void>(undefined),
  favoritesCanExtend: new FeatureChannel<void, boolean>(false),
  navigateToAdjacentSearchPage: new FeatureChannel<NavigationKey, SearchPage | null>(null),
  searchPageThumbs: new FeatureChannel<void, HTMLElement[]>([]),
  currentSearchQuery: new FeatureChannel<void, string>(""),
  usingInfiniteScroll: new FeatureChannel<void, boolean>(false),
  savedSearches: new FeatureChannel<void, string[]>([]),
  favoriteIds: new FeatureChannel<void, Promise<string[]>>(Promise.resolve([])),
  currentGalleryThumb: new FeatureChannel<void, HTMLElement | null>(null)
};

export const inGallery = (): boolean => FeatureBridge.galleryState.call() === GalleryState.Open;
export const galleryIsIdle = (): boolean => FeatureBridge.galleryState.call() === GalleryState.Idle;
