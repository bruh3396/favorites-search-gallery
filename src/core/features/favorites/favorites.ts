import { FavoritesSearchSession, FavoritesSearchSessionSettingDependencies } from "@/core/features/favorites/search/session";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesActions } from "@/core/features/favorites/actions/actions";
import { FavoritesBlacklist } from "@/core/features/favorites/search/blacklist";
import { FavoritesCollection } from "@/core/features/favorites/collection/collection";
import { FavoritesLoader } from "@/core/features/favorites/load/loader";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { LoadState } from "@/core/features/favorites/load/state";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { Readable } from "@/core/utils/reactive/signal";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface FavoritesConfiguration {
  readonly userOwnsFavorites: boolean;
  readonly blacklistedTags: readonly string[];
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
}

export interface FavoritesService {
  readonly actions: Pick<FavoritesActions, "add" | "remove">;
  readonly hydrated: Occurrence<Favorite>;
  readonly loadState: Readable<LoadState>;
  createSearchSession: (settings: FavoritesSearchSessionSettingDependencies) => FavoritesSearchSession;
  isFavorited: (id: string) => boolean;
  load: () => Promise<void>;
}

export function createFavoritesService(configuration: FavoritesConfiguration, dependencies: FavoritesDependencies): FavoritesService {
  const collection = new FavoritesCollection();
  const searchIndex = new FavoritesSearchIndex();
  const blacklist = new FavoritesBlacklist({ blacklistedTags: configuration.blacklistedTags, force: !configuration.userOwnsFavorites });
  const actions = new FavoritesActions({ favoritedByDefault: configuration.userOwnsFavorites }, dependencies);
  const loader = new FavoritesLoader({ ...dependencies, collection, index: searchIndex });
  return {
    actions,
    hydrated: collection.hydrated,
    loadState: loader.state,
    createSearchSession: settings => new FavoritesSearchSession({ ...dependencies, ...settings, index: searchIndex, blacklist }),
    isFavorited: id => actions.isFavorited(id),
    load: () => loader.load()
  };
}
