import { Favorite } from "../../../types/favorite";
import { NavigationKey } from "../../../types/input";

export interface NewFavorites {
  newFavorites: Favorite[]
  newSearchResults: Favorite[]
}

export interface FavoritesFetchProgress {
  resultsCount: number
  allFavoritesCount: number
}

export type FavoritesPaginationParameters = {
  currentPageNumber: number
  finalPageNumber: number
  favoritesCount: number
  startIndex: number
  endIndex: number
};

export const emptyFavoritesPageParameters = {
  currentPageNumber: 1,
  finalPageNumber: 1,
  favoritesCount: 0,
  startIndex: 0,
  endIndex: 0
};

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

export interface FavoritesPageContext {
  results: Favorite[]
  pagination: FavoritesPaginationParameters
  adjacent: Favorite[]
}
