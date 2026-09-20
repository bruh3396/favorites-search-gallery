import { Favorite, FavoritesDrawerView, FavoritesDrawerViewMap } from "@/types/favorite";
import { ContentDisplayOptions } from "@/types/ui";
import { NavigationKey } from "@/types/input";

export interface FavoritesToolbarSlots {
  drawerToggle: HTMLElement;
  searchField: HTMLElement;
  searchButton: HTMLElement;
  searchActions: HTMLElement;
  buttons: HTMLElement;
  aboutHelp: HTMLElement;
  aboutVersion: HTMLElement;
  paginationSlot: HTMLElement;
  resultsCount: HTMLElement;
  loadStatus: HTMLElement;
}

export interface FavoritesToolbarBuild {
  root: HTMLElement;
  slots: FavoritesToolbarSlots;
}

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

export interface FavoritesDisplay {
  initialize: (results: Favorite[], options?: ContentDisplayOptions) => void;
  sync: (newFavorites: Favorite[]) => void;
  advance: (direction: NavigationKey) => boolean;
  goToPage: (pageNumber: number) => void;
  teardown: () => void;
}
