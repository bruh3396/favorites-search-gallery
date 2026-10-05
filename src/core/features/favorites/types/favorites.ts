import { Fact } from "@/core/utils/reactive/milestone";
import { Listing } from "@/core/contracts/listing";
import { LoadState } from "@/core/features/favorites/types/load";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { Page } from "@/core/features/favorites/types/paging";
import { Preference } from "@/core/utils/reactive/preference";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { Rating } from "@/core/domain/post/post";
import { Readable } from "@/core/utils/reactive/signal";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories/remote_tag_categories";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { Sort } from "@/core/features/favorites/types/search";

export interface FavoritesConfiguration {
  userOwnsFavorites: boolean;
  blacklistedTags: string;
}

export interface FavoritesPreferences {
  sort: Preference<Sort>;
  allowedRatings: Preference<ReadonlySet<Rating>>;
  isBlacklistEnabled: Preference<boolean>;
  resultsPerPage: Preference<number>;
  isInfiniteScrollEnabled: Preference<boolean>;
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
  preferences: FavoritesPreferences;
  waitForPaint: () => Promise<void>;
}

export interface FavoritesIntents {
  search: (query: string) => void;
  shuffle: () => void;
  invert: () => void;
  sortBy: (sort: Sort) => void;
  allowRatings: (ratings: ReadonlySet<Rating>) => void;
  setBlacklistEnabled: (enabled: boolean) => void;
  showPage: (pageNumber: number) => void;
  setInfiniteScrollEnabled: (enabled: boolean) => void;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
}

export interface Favorites extends Listing {
  readonly intents: FavoritesIntents;
  readonly finishedLoading: Fact;
  readonly page: Readable<Page>;
  readonly loadState: Readable<LoadState>;
  readonly favoritedChanges: Readable<ReadonlyMap<string, boolean>>;
}
