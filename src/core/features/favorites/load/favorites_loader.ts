import { Readable, Signal } from "@/core/utils/reactive/signal";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesFetcher } from "@/core/features/favorites/load/favorites_fetcher";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesReindexer } from "@/core/features/favorites/load/favorites_reindexer";
import { FavoritesReloader } from "@/core/features/favorites/load/favorites_reloader";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { PostLibrary } from "@/core/features/favorites/load/post_library";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

const SLOW_READ_DELAY = 1_000;

export interface FavoritesLoaderDependencies {
  localFavorites: LocalFavorites;
  localPosts: LocalPosts;
  localTagCategories: LocalTagCategories;
  remoteFavorites: Pick<RemoteFavorites, "fetchCount" | "fetchAll" | "findNew" | "findMissing">;
  remotePosts: RemotePosts;
  remoteMedia: RemoteMedia;
  remotePages: Pick<RemotePages, "postExists">;
  scheduler: Scheduler;
  favoritesCollection: FavoritesCollection;
  favoritesSearchIndex: FavoritesSearchIndex;
}

export class FavoritesLoader {
  private readonly dependencies: FavoritesLoaderDependencies;
  private readonly fetcher: FavoritesFetcher;
  private readonly reloader: FavoritesReloader;
  readonly #state = new Signal<FavoritesLoadState>({ phase: "starting" });

  constructor(dependencies: FavoritesLoaderDependencies) {
    const favoritesReindexer = new FavoritesReindexer(dependencies);
    const postLibrary = new PostLibrary({ ...dependencies, onRefresh: (refreshedPost): void => favoritesReindexer.reindex(refreshedPost) });
    const pathDependencies = {
      ...dependencies,
      postLibrary,
      onFavoritesLoadStateChange: (favoritesLoadState: FavoritesLoadState): void => this.report(favoritesLoadState)
    };

    this.dependencies = dependencies;
    this.fetcher = new FavoritesFetcher(pathDependencies);
    this.reloader = new FavoritesReloader({ ...pathDependencies, waitForPaint: dependencies.scheduler.waitForPaint.bind(dependencies.scheduler) });
  }

  public get state(): Readable<FavoritesLoadState> {
    return this.#state;
  }

  public async load(): Promise<void> {
    try {
      const localPostIds = await this.readLocalPostIds();
      const favoritesLoadResult = await (localPostIds.length > 0 ? this.reloader.reload(localPostIds) : this.fetcher.fetchAll());

      this.report({ phase: "loaded", ...favoritesLoadResult });
    } catch {
      this.report({ phase: "interrupted" });
    }
    this.dependencies.favoritesCollection.compact();
  }

  private async readLocalPostIds(): Promise<readonly string[]> {
    const { localFavorites, scheduler } = this.dependencies;
    const cancelPreparing = scheduler.schedule(() => this.report({ phase: "preparing" }), SLOW_READ_DELAY);

    try {
      return await localFavorites.getAll();
    } finally {
      cancelPreparing();
    }
  }

  private report(favoritesLoadState: FavoritesLoadState): void {
    this.#state.value = favoritesLoadState;
  }
}
