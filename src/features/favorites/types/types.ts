import { Metric, Rating } from "@/types/search";
import { ContentDisplayOptions } from "@/types/ui";
import { Favorite } from "@/types/favorite";
import { Media } from "@/core/domain/media/media";
import { NavigationKey } from "@/types/input";
import { Post } from "@/core/domain/post/post";
import { SettingsControl } from "@/lib/ui/settings/controls";
import { TermUpdate } from "@/lib/search/engines/search_engine";

export interface Arena {
  allocate: () => number;
  write: (index: number, post: Post) => void;
  id: (index: number) => number;
  rating: (index: number) => Rating;
  getMetric: (index: number, metric: Metric) => number;
  media: (index: number) => Media;
  isNewFavorite: (index: number) => boolean;
  markNew: (index: number) => void;
  setDurationSeconds: (index: number, durationSeconds: number) => void;
  cacheTagSet: (index: number, tags: Set<string>) => void;
  tagSet: (index: number) => Set<string>;
  consumeTagSet: (index: number) => Set<string>;
  toPost: (index: number) => Post;
}

export interface PostLibrary {
  streamAll: (ids: string[], batchSize: number, onProgress: (posts: Post[]) => void) => Promise<void>;
  storeMissing: (posts: Post[]) => Promise<void>;
  refreshAll: (posts: Post[]) => Promise<void>;
}

export interface Collection {
  append: (posts: Post[]) => Favorite[];
  appendDirty: (posts: Post[]) => Favorite[];
  prependDirty: (posts: Post[]) => Favorite[];
  get: (id: string) => Favorite | undefined;
  getAllIds: () => Set<string>;
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
  initialize: (results: Favorite[], options?: ContentDisplayOptions) => void;
  sync: (newFavorites: Favorite[]) => void;
  advance: (direction: NavigationKey) => boolean;
  goToPage: (pageNumber: number) => void;
  teardown: () => void;
}

export type FavoritesPaginationAction = "page" | "step" | "gotoToggle" | "gotoSubmit";

export interface FavoritesViewDependencies {
  onContentReplaced: () => void;
  onContentAdded: (favorites: Favorite[]) => void;
}

export interface SettingsSection {
  title: string;
  expanded?: boolean;
  controls: SettingsControl[];
}
