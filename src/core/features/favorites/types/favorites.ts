import { PaginationResult, PaginationSettings } from "@/core/features/favorites/types/pagination";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { LoadState } from "@/core/features/favorites/types/load";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { Preference } from "@/core/utils/reactive/preference";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { Readable } from "@/core/utils/reactive/signal";
import { RemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories/remote_tag_categories";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SearchSettings } from "@/core/features/favorites/types/search";

export interface FavoritesConfiguration {
  userOwnsFavorites: boolean;
  blacklistedTags: string;
}

export interface FavoritesDependencies {
  localFavorites: LocalFavorites;
  localPosts: LocalPosts;
  localTagCategories: LocalTagCategories;
  remoteFavorites: RemoteFavorites;
  remoteFavoriteActions: ObservableRemoteFavoriteActions;
  remotePosts: RemotePosts;
  remoteTagCategories: RemoteTagCategories;
  remoteMedia: RemoteMedia;
  scheduler: Scheduler;
  randomSource: RandomSource;
  searchSettings: Preference<SearchSettings>;
  paginationSettings: Preference<PaginationSettings>;
  waitForPaint: () => Promise<void>;
}

export interface FavoritesIntents {
  search: (query: string) => void;
  updateSearchSettings: (change: Partial<SearchSettings>) => void;
  shuffle: () => void;
  invert: () => void;
  updatePaginationSettings: (change: Partial<PaginationSettings>) => void;
  goToPage: (pageNumber: number) => void;
  addFavorite: RemoteFavoriteActions["add"];
  removeFavorite: RemoteFavoriteActions["remove"];
}

export interface Favorites {
  readonly intents: FavoritesIntents;
  readonly searchResults: Readable<readonly Favorite[]>;
  readonly paginationResult: Readable<PaginationResult>;
  readonly hydrated: Occurrence<Favorite>;
  readonly loadState: Readable<LoadState>;
  readonly isFavorited: (id: string) => boolean;
  readonly load: () => Promise<void>;
}
