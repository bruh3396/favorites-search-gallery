import { Readable, Signal } from "@/core/utils/reactive/signal";
import { FavoritesCollection } from "@/core/features/favorites/collection/collection";
import { FavoritesFetcher } from "@/core/features/favorites/load/fetcher";
import { FavoritesReindexer } from "@/core/features/favorites/load/reindexer";
import { FavoritesReloader } from "@/core/features/favorites/load/reloader";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { LoadState } from "@/core/features/favorites/load/state";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { PostLibrary } from "@/core/features/favorites/load/library";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

const SLOW_READ_DELAY = 1_000;

export interface FavoritesLoaderDependencies {
  localFavorites: LocalFavorites;
  localPosts: LocalPosts;
  localTagCategories: LocalTagCategories;
  remoteFavorites: RemoteFavorites;
  remotePosts: RemotePosts;
  remoteMedia: RemoteMedia;
  scheduler: Scheduler;
  collection: FavoritesCollection;
  index: FavoritesSearchIndex;
}

export class FavoritesLoader {
  private readonly current = new Signal<LoadState>({ phase: "starting" });
  private readonly dependencies: FavoritesLoaderDependencies;
  private readonly fetcher: FavoritesFetcher;
  private readonly reloader: FavoritesReloader;

  constructor(dependencies: FavoritesLoaderDependencies) {
    const reindexer = new FavoritesReindexer(dependencies);
    const postLibrary = new PostLibrary({ ...dependencies, onRefresh: (refreshed): void => reindexer.reindex(refreshed) });
    const pathDependencies = { ...dependencies, postLibrary, report: (state: LoadState): void => this.report(state) };

    this.dependencies = dependencies;
    this.fetcher = new FavoritesFetcher(pathDependencies);
    this.reloader = new FavoritesReloader({ ...pathDependencies, waitForPaint: dependencies.scheduler.waitForPaint.bind(dependencies.scheduler) });
  }

  public get state(): Readable<LoadState> {
    return this.current;
  }

  public async load(): Promise<void> {
    try {
      const localIds = await this.readLocalIds();
      const result = await (localIds.length > 0 ? this.reloader.reload(localIds) : this.fetcher.fetchAll());

      this.report({ phase: "loaded", ...result });
    } catch {
      this.report({ phase: "interrupted" });
    }
    this.dependencies.collection.compact();
  }

  private async readLocalIds(): Promise<readonly string[]> {
    const { localFavorites, scheduler } = this.dependencies;
    const cancelPreparing = scheduler.schedule(() => this.report({ phase: "preparing" }), SLOW_READ_DELAY);

    try {
      return await localFavorites.getAll();
    } finally {
      cancelPreparing();
    }
  }

  private report(state: LoadState): void {
    this.current.value = state;
  }
}
