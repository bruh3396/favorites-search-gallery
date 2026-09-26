import { Favorite, FavoritesDrawerView, FavoritesDrawerViewMap } from "@/types/favorite";
import { MediaExtension, MediaType } from "@/types/media";
import { Metric, Rating } from "@/types/search";
import { ContentDisplayOptions } from "@/types/ui";
import { NavigationKey } from "@/types/input";
import { Post } from "@/types/api";

export interface Arena {
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

export interface Store {
  readAll: () => Promise<Post[]>;
  streamAll: (onBatch: (posts: Post[]) => void) => Promise<void>;
}

export interface Fetcher {
  fetchAll: (onFavoritesFound: (posts: Post[]) => void, firstPageFavorites?: Post[]) => Promise<void>;
  fetchNew: (existingIds: Set<string>, firstPageFavorites?: Post[]) => Promise<Post[]>;
}

export interface Collection {
  setAll: (posts: Post[]) => Favorite[];
  append: (posts: Post[]) => Favorite[];
  appendDirty: (posts: Post[]) => Favorite[];
  prependDirty: (posts: Post[]) => Favorite[];
  getAll: () => Favorite[];
  getAllIds: () => Set<string>;
}

export interface Searcher {
  add: (favorites: Favorite[]) => void;
  appendResults: (favorites: Favorite[]) => Favorite[];
}

export interface Enricher {
  enrich: (favorites: Favorite[]) => Promise<void>;
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

export interface Display {
  initialize: (results: Favorite[], options?: ContentDisplayOptions) => void;
  sync: (newFavorites: Favorite[]) => void;
  advance: (direction: NavigationKey) => boolean;
  goToPage: (pageNumber: number) => void;
  teardown: () => void;
}
