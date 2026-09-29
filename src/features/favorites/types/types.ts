import { Metric, Rating } from "@/types/search";
import { ContentDisplayOptions } from "@/types/ui";
import { Favorite } from "@/types/favorite";
import { Media } from "@/core/domain/media/media";
import { NavigationKey } from "@/types/input";
import { Post } from "@/core/domain/post/post";
import { SettingsControl } from "@/lib/ui/settings/controls";

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

export interface Store {
  readAll: () => Promise<Post[]>;
  streamAll: (onBatch: (posts: Post[]) => void) => Promise<void>;
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
