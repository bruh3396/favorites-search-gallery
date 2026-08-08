import { FeatureNamespaced, GalleryState } from "@/types/app";
import { Favorite } from "@/types/favorite";
import { FeatureChannel } from "@/lib/communication/feature_channel";
import { NavigationKey } from "@/types/input";
import { ON_POST_LIST_PAGE } from "@/lib/environment";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { TagCategory } from "@/types/search";

export const FeatureBridge = {
  favorites: {
    allFavorites: new FeatureChannel<void, Favorite[]>([]),
    favoriteIds: new FeatureChannel<void, Promise<string[]>>(Promise.resolve([])),
    getFavorite: new FeatureChannel<string, Favorite | undefined>(undefined),
    loadMore: new FeatureChannel<NavigationKey, boolean>(false),
    searchQuery: new FeatureChannel<void, string>(""),
    searchResults: new FeatureChannel<void, Favorite[]>([]),
    usingInfiniteScroll: new FeatureChannel<void, boolean>(false)
  },
  gallery: {
    currentThumb: new FeatureChannel<void, HTMLElement | null>(null),
    state: new FeatureChannel<void, GalleryState>("idle")
  },
  postOverlay: {
    tagCategory: new FeatureChannel<string, TagCategory | undefined>(undefined)
  },
  postList: {
    navigateToAdjacent: new FeatureChannel<NavigationKey, PostList | null>(null),
    searchQuery: new FeatureChannel<void, string>(""),
    thumbs: new FeatureChannel<void, HTMLElement[]>([]),
    usingInfiniteScroll: new FeatureChannel<void, boolean>(false)
  },
  savedSearches: {
    savedSearches: new FeatureChannel<void, string[]>([])
  }
} satisfies FeatureNamespaced;

export const galleryOpened = (): boolean => FeatureBridge.gallery.state.call() === "open";
export const galleryIdle = (): boolean => FeatureBridge.gallery.state.call() === "idle";
export const getCurrentSearchQuery = ON_POST_LIST_PAGE ? (): string => FeatureBridge.postList.searchQuery.call() : (): string => FeatureBridge.favorites.searchQuery.call();
export const usingInfiniteScroll = ON_POST_LIST_PAGE ? (): boolean => FeatureBridge.postList.usingInfiniteScroll.call() : (): boolean => FeatureBridge.favorites.usingInfiniteScroll.call();
