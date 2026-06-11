import { Favorite } from "@/types/favorite";
import { FeatureChannel } from "@/lib/communication/feature_channel";
import { GalleryState } from "@/types/ui";
import { NavigationKey } from "@/types/input";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";

export const FeatureBridge = {
  galleryState: new FeatureChannel<void, GalleryState>("idle"),
  allFavorites: new FeatureChannel<void, Favorite[]>([]),
  getFavorite: new FeatureChannel<string, Favorite | undefined>(undefined),
  favoritesSearchResults: new FeatureChannel<void, Favorite[]>([]),
  loadMoreFavorites: new FeatureChannel<NavigationKey, boolean>(false),
  navigateToAdjacentPostList: new FeatureChannel<NavigationKey, PostList | null>(null),
  postListThumbs: new FeatureChannel<void, HTMLElement[]>([]),
  currentSearchQuery: new FeatureChannel<void, string>(""),
  usingInfiniteScroll: new FeatureChannel<void, boolean>(false),
  savedSearches: new FeatureChannel<void, string[]>([]),
  favoriteIds: new FeatureChannel<void, Promise<string[]>>(Promise.resolve([])),
  currentGalleryThumb: new FeatureChannel<void, HTMLElement | null>(null)
};

export const inGallery = (): boolean => FeatureBridge.galleryState.call() === "open";
export const galleryIsIdle = (): boolean => FeatureBridge.galleryState.call() === "idle";
