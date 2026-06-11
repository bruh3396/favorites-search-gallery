import { Favorite } from "@/types/favorite";
import { NavigationKey } from "@/types/input";
import { PaginationSequence } from "@/types/ui";
import { TagCategoryMap } from "@/types/search";

export interface FavoritesViewCallbacks {
  onPageSelected: (pageNumber: number) => void
  onPageStepped: (direction: NavigationKey) => void
}

export interface FavoritesModelCallbacks {
  getAdditionalTags: (id: string) => string | undefined
  waitForAdditionalTags: () => Promise<void>
  onTagCategoriesResolved: (categoryMap: TagCategoryMap) => void
}

export interface NewFavorites {
  newFavorites: Favorite[]
  newSearchResults: Favorite[]
}

export interface FavoritesFetchProgress {
  resultsCount: number
  allFavoritesCount: number
}

export interface PaginationContext {
  totalCount: number
  sliceStart: number
  sliceEnd: number
  currentPage: number
  finalPage: number
  sequence: PaginationSequence
}

export interface FavoritesResultsView {
  initialize: (results: Favorite[]) => void
  reveal: (id: string) => void
  sync: () => void
  loadMore: (direction: NavigationKey) => boolean
}

export interface ScrollExpansionResult {
  slice: Favorite[]
  trimmed: Favorite[]
}
