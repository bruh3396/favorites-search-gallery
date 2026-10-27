import { Fact } from "@/core/utils/reactive/fact";
import { Milestone } from "@/core/utils/reactive/milestone";
import { FavoritesSession, FavoritesSessionConfiguration } from "@/core/features/favorites/session/favorites_session";
import { Readable, computed } from "@/core/utils/reactive/signal";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesActions } from "@/core/features/favorites/actions/favorites_actions";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesLoader } from "@/core/features/favorites/load/favorites_loader";
import { FavoritesPaginationPreferences } from "@/core/features/favorites/session/favorites_pagination";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { StringInterner } from "@/core/utils/string/string_interner";
import { describeFavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state_describer";

export interface FavoritesServiceConfiguration {
  readonly userOwnsFavorites: boolean;
  readonly blacklistedTags: readonly string[];
}

export interface FavoritesServiceDependencies {
  localFavorites: LocalFavorites;
  localPosts: LocalPosts;
  localTagCategories: LocalTagCategories;
  remoteFavorites: RemoteFavorites;
  remotePosts: RemotePosts;
  remoteMedia: RemoteMedia;
  scheduler: Scheduler;
  randomSource: RandomSource;
  favoritesPaginationPreferences: FavoritesPaginationPreferences;
}

export interface FavoritesService {
  readonly actions: Pick<FavoritesActions, "add" | "remove">;
  readonly hydrated: Occurrence<Favorite>;
  readonly loadState: Readable<FavoritesLoadState>;
  readonly loadStatus: Readable<string>;
  readonly searchable: Fact;
  createSession: (configuration: FavoritesSessionConfiguration) => FavoritesSession;
  isFavorited: (id: string) => boolean;
  countFavoritesWithTag: (tag: string) => number;
  load: () => Promise<void>;
}

export function createFavoritesService(configuration: FavoritesServiceConfiguration, dependencies: FavoritesServiceDependencies): FavoritesService {
  const loaded = new Milestone();
  const stringInterner = new StringInterner();
  const collection = new FavoritesCollection(stringInterner);
  const searchIndex = new FavoritesSearchIndex(stringInterner);
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
    loadStatus: computed(() => describeFavoritesLoadState(loader.state.value)),
    searchable: searchIndex.populated,
    createSession: sessionConfiguration => new FavoritesSession(sessionConfiguration, {
      searchIndex,
      blacklist,
      randomSource: dependencies.randomSource,
      favoritesPaginationPreferences: dependencies.favoritesPaginationPreferences
    }),
    isFavorited: id => actions.isFavorited(id),
    countFavoritesWithTag: tag => searchIndex.countFavoritesWithTag(tag),
    load: async(): Promise<void> => {
      await loader.load();
      loaded.reach();
    }
  };
}
