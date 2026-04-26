import { LayoutMode, NavigationKey } from "../../../types/common_types";
import { FavoriteItem } from "./favorite_item";

export interface FavoriteElement {
  root: HTMLElement
  container: HTMLAnchorElement
  image: HTMLImageElement
  favoriteButton: HTMLImageElement
  downloadButton: HTMLImageElement
  thumbURL: string
}

export interface NewFavorites {
  newFavorites: FavoriteItem[]
  newSearchResults: FavoriteItem[]
}

export type FavoritesPaginationParameters = {
  currentPageNumber: number
  finalPageNumber: number
  favoritesCount: number
  startIndex: number
  endIndex: number
};

export const EMPTY_FAVORITES_PAGINATION_PARAMETERS = {
  currentPageNumber: 1,
  finalPageNumber: 1,
  favoritesCount: 0,
  startIndex: 0,
  endIndex: 0
};

export interface FavoritesPresentationFlow {
  present: (results: FavoriteItem[]) => void;
  onLayoutChanged: (layout: LayoutMode) => void;
  revealFavorite: (id: string) => void;
  reset: () => void;
  handleNewSearchResults: () => void;
  loadNewFavoritesInGallery: (direction: NavigationKey) => boolean;
}
