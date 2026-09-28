import { AppMode, Environment } from "@/core/boundary/environment";
import { MediaItem } from "@/types/media";
import { Post } from "@/core/domain/post/post";
import { TagCategoryMap } from "@/types/search";

export type ParsedPost = {
  post: Post;
  tagCategories: TagCategoryMap;
};

export type AddFavoriteStatus = "error" | "alreadyAdded" | "loggedOut" | "success";
export type RemoveFavoriteStatus = "error" | "forbidden" | "success";

export interface Ports {
  postSource: PostSource;
  tagSource: TagSource;
  favoritesSource: FavoritesSource;
  favoritesEditor: FavoritesEditor;
  navigation: Navigation;
  host: Host;
  telemetry: Telemetry;
}

export interface PostSource {
  fetch: (id: string) => Promise<ParsedPost>;
}

export interface TagSource {
  categorize: (postId: string, tagNames: string[]) => Promise<TagCategoryMap>;
}

export interface FavoritesSource {
  fetchAll: (onFavoritesFound: (posts: Post[]) => void) => Promise<void>;
  fetchNew: (existingIds: Set<string>) => Promise<Post[]>;
  count: () => Promise<number | null>;
}

export interface FavoritesEditor {
  add: (id: string) => Promise<AddFavoriteStatus>;
  remove: (id: string) => Promise<RemoveFavoriteStatus>;
}

export interface Navigation {
  postUrl: (id: string) => string;
  openPost: (id: string) => void;
  openMedia: (item: MediaItem) => void;
  openSearch: (query: string) => void;
}

export interface Host {
  takeOver: (mode: AppMode) => void;
}

export interface Telemetry {
  announce: (environment: Environment) => void;
}
