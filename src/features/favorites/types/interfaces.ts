import { Favorite, PageRelation } from "@/types/favorite";
import { NavigationKey } from "@/types/input";
import { TagCategoryMap } from "@/types/search";

export interface FavoritesViewCallbacks {
  onPageSelected: (pageNumber: number) => void;
  onRelativePageSelected: (relation: PageRelation) => void;
  onFirstPageFavoritesExtracted: (elements: HTMLElement[] | undefined) => void;
  onFavoriteAdded: (id: string) => void;
  onFavoriteRemoved: (id: string) => void;
}

export interface FavoritesModelCallbacks {
  getAdditionalTags: (id: string) => string | undefined;
  waitForAdditionalTags: () => Promise<void>;
  onTagCategoriesResolved: (categoryMap: TagCategoryMap) => void;
}

export interface NewFavorites {
  newFavorites: Favorite[]
  newSearchResults: Favorite[]
}

export interface FavoritesFetchProgress {
  resultsCount: number
  allFavoritesCount: number
}

export interface FavoritesPaginationParameters {
  currentPageNumber: number
  finalPageNumber: number
  favoritesCount: number
  startIndex: number
  endIndex: number
}

export interface FavoritesResultsView {
  initialize: (results: Favorite[]) => void
  reveal: (id: string) => void
  sync: () => void
  hasMore: () => boolean
  loadMore: (direction: NavigationKey) => void
}

export interface ScrollExpansionResult {
  slice: Favorite[]
  trimmed: Favorite[]
}
