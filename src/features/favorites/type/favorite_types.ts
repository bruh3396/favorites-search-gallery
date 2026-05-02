import { Favorite } from "../../../types/favorite";
import { LayoutMode } from "../../../types/ui";
import { NavigationKey } from "../../../types/input";

export interface NewFavorites {
  newFavorites: Favorite[]
  newSearchResults: Favorite[]
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

export interface FavoritesPresentationFlow {
  present: (results: Favorite[]) => void;
  onLayoutChanged: (layout: LayoutMode) => void;
  revealFavorite: (id: string) => void;
  reset: () => void;
  handleNewSearchResults: () => void;
  loadNewFavoritesInGallery: (direction: NavigationKey) => boolean;
}
