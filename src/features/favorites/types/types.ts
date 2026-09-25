import { Favorite, FavoritesDrawerView, FavoritesDrawerViewMap } from "@/types/favorite";
import { MediaExtension, MediaType } from "@/types/media";
import { Metric, Rating } from "@/types/search";
import { ContentDisplayOptions } from "@/types/ui";
import { NavigationKey } from "@/types/input";
import { Post } from "@/types/api";

export interface FavoritesArena {
  allocate: () => number;
  write: (index: number, post: Post) => void;
  id: (index: number) => number;
  rating: (index: number) => Rating;
  getMetric: (index: number, metric: Metric) => number;
  extension: (index: number) => MediaExtension | undefined;
  isNewFavorite: (index: number) => boolean;
  markNew: (index: number) => void;
  previewUrl: (index: number) => string;
  setDuration: (index: number, duration: number) => void;
  cacheTagSet: (index: number, tags: Set<string>) => void;
  tagSet: (index: number) => Set<string>;
  consumeTagSet: (index: number) => Set<string>;
  mediaType: (index: number) => MediaType;
  toPost: (index: number) => Post;
}

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

export interface ThumbOperations<Node> {
  create: () => Node;
  bind: (node: Node, favorite: Favorite, favorited: boolean) => void;
  setAsFavorited: (node: Node, favorited: boolean) => void;
  blankImage: (node: Node) => void;
}

export interface FavoritesDisplay {
  initialize: (results: Favorite[], options?: ContentDisplayOptions) => void;
  sync: (newFavorites: Favorite[]) => void;
  advance: (direction: NavigationKey) => boolean;
  goToPage: (pageNumber: number) => void;
  teardown: () => void;
}
