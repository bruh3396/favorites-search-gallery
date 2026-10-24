import { Fact, Milestone } from "@/core/utils/reactive/milestone";
import { FavoritesSession, FavoritesSessionConfiguration } from "@/core/features/favorites/session/session";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesActions } from "@/core/features/favorites/actions/actions";
import { FavoritesBlacklist } from "@/core/features/favorites/search/blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/collection";
import { FavoritesLoader } from "@/core/features/favorites/load/loader";
import { FavoritesPaginationSettings } from "@/core/features/favorites/session/pagination";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { LoadState } from "@/core/features/favorites/load/state";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { describeLoadState } from "@/core/features/favorites/load/status";

export { default as FAVORITES_STYLES } from "@/core/features/favorites/styles.css?inline";

export interface FavoritesConfiguration {
  readonly userOwnsFavorites: boolean;
  readonly blacklistedTags: readonly string[];
}

export interface FavoritesDependencies {
  localFavorites: LocalFavorites;
  localPosts: LocalPosts;
  localTagCategories: LocalTagCategories;
  remoteFavorites: RemoteFavorites;
  remotePosts: RemotePosts;
  remoteMedia: RemoteMedia;
  scheduler: Scheduler;
  randomSource: RandomSource;
  paginationSettings: FavoritesPaginationSettings;
}

export interface FavoritesService {
  readonly actions: Pick<FavoritesActions, "add" | "remove">;
  readonly hydrated: Occurrence<Favorite>;
  readonly loadState: Readable<LoadState>;
  readonly loadStatus: Readable<string>;
  readonly loaded: Fact;
  createSession: (configuration: FavoritesSessionConfiguration) => FavoritesSession;
  isFavorited: (id: string) => boolean;
  load: () => Promise<void>;
}

export function createFavoritesService(configuration: FavoritesConfiguration, dependencies: FavoritesDependencies): FavoritesService {
  const loaded = new Milestone();
  const collection = new FavoritesCollection();
  const searchIndex = new FavoritesSearchIndex();
  const blacklist = new FavoritesBlacklist({ blacklistedTags: configuration.blacklistedTags, force: !configuration.userOwnsFavorites });
  const actions = new FavoritesActions({ favoritedByDefault: configuration.userOwnsFavorites }, {
    ...dependencies,
    acceptsChanges: (): boolean => !configuration.userOwnsFavorites || loaded.reached
  });
  const loader = new FavoritesLoader({ ...dependencies, collection, index: searchIndex });
  return {
    actions,
    hydrated: collection.hydrated,
    loadState: loader.state,
    loadStatus: computed(() => describeLoadState(loader.state.value)),
    loaded,
    createSession: sessionConfiguration => new FavoritesSession(sessionConfiguration, {
      searchIndex,
      blacklist,
      randomSource: dependencies.randomSource,
      paginationSettings: dependencies.paginationSettings
    }),
    isFavorited: id => actions.isFavorited(id),
    load: async(): Promise<void> => {
      await loader.load();
      loaded.reach();
    }
  };
}
