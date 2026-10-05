import { RatingMask } from "@/types/search";
import { Favorite } from "@/types/favorite";
import { Media } from "@/core/domain/media/media";
import { NavigationKey } from "@/types/input";
import { Metric, Post } from "@/core/domain/post/post";
import { SettingsControl } from "@/lib/ui/settings/controls";
import { TermUpdate } from "@/core/search/engines/search_engine";

export interface Arena {
  allocate: () => number;
  write: (index: number, post: Post) => void;
  id: (index: number) => number;
  rating: (index: number) => RatingMask;
  getMetric: (index: number, metric: Metric) => number;
  media: (index: number) => Media;
  isNewFavorite: (index: number) => boolean;
  markNew: (index: number) => void;
  cacheTagSet: (index: number, tags: Set<string>) => void;
  tagSet: (index: number) => Set<string>;
  consumeTagSet: (index: number) => Set<string>;
}

export interface PostLibrary {
  streamAll: (ids: string[], batchSize: number, onProgress: (posts: Post[]) => void) => Promise<void>;
  adopt: (posts: Post[]) => Promise<Post[]>;
  refreshAll: (posts: Post[]) => Promise<void>;
}

export interface Collection {
  append: (posts: Post[]) => Favorite[];
  appendDirty: (posts: Post[]) => Favorite[];
  prependDirty: (posts: Post[]) => Favorite[];
  get: (id: string) => Favorite | undefined;
  getAllIds: () => Set<string>;
  write: (post: Post) => void;
  markNew: (ids: string[]) => void;
  consumeTags: (id: string) => Set<string>;
  getRating: (id: string) => RatingMask;
}

export interface Searcher {
  add: (favorites: Favorite[]) => void;
  update: (updates: readonly TermUpdate<Favorite>[]) => void;
  appendResults: (favorites: Favorite[]) => Favorite[];
}

export interface ThumbOperations<Node> {
  create: () => Node;
  bind: (node: Node, favorite: Favorite, favorited: boolean) => void;
  setAsFavorited: (node: Node, favorited: boolean) => void;
  blankImage: (node: Node) => void;
}

export interface Display {
  initialize: (results: Favorite[]) => void;
  sync: (newFavorites: Favorite[]) => void;
  advance: (direction: NavigationKey) => boolean;
  goToPage: (pageNumber: number) => void;
  teardown: () => void;
}

export type FavoritesPaginationAction = "page" | "step" | "gotoToggle" | "gotoSubmit";

export interface FavoritesModelCallbacks {
  onSearchResultsChanged: (results: Favorite[]) => void;
  onPlaceholderFilled: (favorite: Favorite) => void;
}

export interface PulledFavorites {
  addedFavorites: Favorite[];
  prependedCount: number;
}

export interface LoadProgress {
  loaded: number;
  total: number;
}

export interface FavoritesViewCallbacks {
  onContentReplaced: () => void;
  onContentAdded: (favorites: Favorite[]) => void;
}

export interface SettingsSection {
  title: string;
  expanded?: boolean;
  controls: SettingsControl[];
}
