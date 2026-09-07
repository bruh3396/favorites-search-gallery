import { Favorite, FavoritesDrawerView, FavoritesDrawerViewMap } from "@/types/favorite";
import { ContentDisplayOptions } from "@/types/ui";
import { NavigationKey } from "@/types/input";

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
  onSearchResultsChanged: (searchResults: Favorite[]) => void;
}

export interface FavoritesDisplay {
  initialize: (results: Favorite[], options?: ContentDisplayOptions) => void;
  sync: (newFavorites: Favorite[]) => void;
  advance: (direction: NavigationKey) => boolean;
  goToPage: (pageNumber: number) => void;
  teardown: () => void;
}

export interface NewFavoritesResult {
  favorites: Favorite[];
  searchResults: Favorite[];
}
