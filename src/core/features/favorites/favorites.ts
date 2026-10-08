import { FavoritesActionIntents, FavoritesActions } from "@/core/features/favorites/actions/actions";
import { BitSearchEngine } from "@/core/search/engines/bit/bit_search_engine";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesBlacklist } from "@/core/features/favorites/search/blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/collection";
import { FavoritesLoader } from "@/core/features/favorites/load/loader";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { FavoritesSearchSession } from "@/core/features/favorites/search/session";
import { LoadState } from "@/core/features/favorites/load/state";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { PaginationSettings } from "@/core/features/favorites/search/pagination";
import { Preference } from "@/core/utils/reactive/preference";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { Readable } from "@/core/utils/reactive/signal";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SearchSettings } from "@/core/features/favorites/search/settings";

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
  remoteMedia: RemoteMedia;
  scheduler: Scheduler;
  randomSource: RandomSource;
  paginationSettings: Pick<Preference<PaginationSettings>, "value" | "changed">;
  waitForPaint: () => Promise<void>;
}

export interface Favorites {
  readonly createSearchSession: (searchSettings: Preference<SearchSettings>) => FavoritesSearchSession;
  readonly actions: FavoritesActionIntents;
  readonly hydrated: Occurrence<Favorite>;
  readonly loadState: Readable<LoadState>;
  readonly isFavorited: (id: string) => boolean;
  readonly load: () => Promise<void>;
}

export function createFavorites(configuration: FavoritesConfiguration, dependencies: FavoritesDependencies): Favorites {
  const collection = new FavoritesCollection();
  const index = new FavoritesSearchIndex(new BitSearchEngine<Favorite>(favorite => favorite.tags, (favorite, metric) => favorite.getMetric(metric)));
  const blacklist = new FavoritesBlacklist({ blacklistedTags: configuration.blacklistedTags, isForced: !configuration.userOwnsFavorites });
  const actions = new FavoritesActions({ favoritedByDefault: configuration.userOwnsFavorites }, dependencies);
  const loader = new FavoritesLoader({ ...dependencies, collection, index });
  return {
    createSearchSession: searchSettings => new FavoritesSearchSession({ ...dependencies, index, blacklist, searchSettings }),
    actions,
    hydrated: collection.hydrated,
    loadState: loader.state,
    isFavorited: id => actions.isFavorited(id),
    load: () => loader.load()
  };
}
