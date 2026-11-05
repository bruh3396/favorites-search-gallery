import { FavoritesSession, FavoritesSessionConfiguration } from "@/core/features/favorites/session/favorites_session";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { Fact } from "@/core/utils/reactive/fact";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesActions } from "@/core/features/favorites/actions/favorites_actions";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesFetcher } from "@/core/features/favorites/load/favorites_fetcher";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesLoader } from "@/core/features/favorites/load/favorites_loader";
import { FavoritesPaginationPreferences } from "@/core/features/favorites/session/favorites_pagination";
import { FavoritesReindexer } from "@/core/features/favorites/load/favorites_reindexer";
import { FavoritesReloader } from "@/core/features/favorites/load/favorites_reloader";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { Milestone } from "@/core/utils/reactive/milestone";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { PostLibrary } from "@/core/features/favorites/load/post_library";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { StringInterner } from "@/core/utils/string/string_interner";
import { describeFavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state_describer";

export interface FavoritesServiceConfiguration {
  readonly userOwnsFavorites: boolean;
  readonly blacklistedTags: readonly string[];
}

export interface FavoritesServiceDependencies {
  localFavorites: LocalFavorites;
  remoteFavorites: RemoteFavorites;
  remotePages: Pick<RemotePages, "postExists">;
  scheduler: Scheduler;
  postLibrary: PostLibrary;
  randomSource: RandomSource;
  favoritesPaginationPreferences: FavoritesPaginationPreferences;
}

export interface FavoritesService {
  readonly actions: Pick<FavoritesActions, "add" | "remove">;
  readonly hydrated: Occurrence<Favorite>;
  readonly loadState: Readable<FavoritesLoadState>;
  readonly loadStatus: Readable<string>;
  readonly searchable: Fact;
  createSession: (favoritesSessionConfiguration: FavoritesSessionConfiguration) => FavoritesSession;
  isFavorited: (postId: string) => boolean;
  countFavoritesWithTag: (tag: string) => number;
  getTagsStartingWith: (prefix: string) => readonly string[];
  load: () => Promise<void>;
}

export function createFavoritesService(configuration: FavoritesServiceConfiguration, dependencies: FavoritesServiceDependencies): FavoritesService {
  const loaded = new Milestone();
  const stringInterner = new StringInterner();
  const favoritesCollection = new FavoritesCollection(stringInterner);
  const favoritesSearchIndex = new FavoritesSearchIndex(stringInterner);
  const favoritesBlacklist = new FavoritesBlacklist({ blacklistedTags: configuration.blacklistedTags, force: !configuration.userOwnsFavorites });
  const { localFavorites, remoteFavorites, remotePages, scheduler, postLibrary } = dependencies;
  const favoritesActions = new FavoritesActions({ favoritedByDefault: configuration.userOwnsFavorites }, {
    remoteFavorites, localFavorites,
    acceptsChanges: (): boolean => !configuration.userOwnsFavorites || loaded.reached
  });
  const favoritesReindexer = new FavoritesReindexer({ scheduler, favoritesCollection, favoritesSearchIndex });
  const favoritesLoader = new FavoritesLoader({
    localFavorites, scheduler, favoritesCollection,
    favoritesFetcher: new FavoritesFetcher({ localFavorites, remoteFavorites, favoritesCollection, favoritesSearchIndex, postLibrary }),
    favoritesReloader: new FavoritesReloader({
      localFavorites, remoteFavorites, remotePages, favoritesCollection, favoritesSearchIndex, postLibrary,
      waitForPaint: (): Promise<void> => scheduler.waitForPaint()
    })
  });

  postLibrary.refreshed.on(refreshedPost => favoritesReindexer.reindex(refreshedPost));
  return {
    actions: favoritesActions,
    hydrated: favoritesCollection.hydrated,
    loadState: favoritesLoader.state,
    loadStatus: computed(() => describeFavoritesLoadState(favoritesLoader.state.value)),
    searchable: favoritesSearchIndex.populated,
    createSession: favoritesSessionConfiguration => new FavoritesSession(favoritesSessionConfiguration, {
      favoritesSearchIndex,
      favoritesBlacklist,
      randomSource: dependencies.randomSource,
      favoritesPaginationPreferences: dependencies.favoritesPaginationPreferences
    }),
    isFavorited: postId => favoritesActions.isFavorited(postId),
    countFavoritesWithTag: tag => favoritesSearchIndex.countFavoritesWithTag(tag),
    getTagsStartingWith: prefix => favoritesSearchIndex.getTagsStartingWith(prefix),
    load: async(): Promise<void> => {
      await favoritesLoader.load();
      loaded.reach();
    }
  };
}
