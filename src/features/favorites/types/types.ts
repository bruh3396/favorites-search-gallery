import { ContentDisplayOptions, PaginationSequence } from "@/types/ui";
import { Favorite, FavoritesDrawerView, FavoritesDrawerViewMap } from "@/types/favorite";
import { NavigationKey } from "@/types/input";
import { TagCategoryMap } from "@/types/search";

export interface FavoritesViewDependencies {
  onPageSelected: (pageNumber: number) => void;
  onPageStepped: (direction: NavigationKey) => void;
  onContentReplaced: () => void;
  onContentAdded: (favorites: Favorite[]) => void;
  onDrawerOpen: () => void;
  onDrawerViewSelected: (view: FavoritesDrawerView) => void;
  onShowControls: () => void;
  drawerViews: FavoritesDrawerViewMap;
}

export interface FavoritesModelDependencies {
  onTagCategoriesResolved: (categoryMap: TagCategoryMap) => void;
  onSearchResultsChanged: (searchResults: Favorite[]) => void;
}

export interface FavoritesDisplay {
  initialize: (results: Favorite[], options?: ContentDisplayOptions) => void;
  sync: (newFavorites: Favorite[]) => void;
  advance: (direction: NavigationKey) => boolean;
  goToPage: (pageNumber: number) => void;
  teardown: () => void;
}

export interface PaginationState {
  totalCount: number;
  sliceStart: number;
  sliceEnd: number;
  currentPage: number;
  finalPage: number;
  sequence: PaginationSequence;
}

export interface NewFavoritesResult {
  favorites: Favorite[];
  searchResults: Favorite[];
}
