import { Readable, Signal } from "@/core/utils/reactive/signal";
import { FavoritesDependencies } from "@/core/features/favorites/types/favorites";
import { FavoritesFetcher } from "@/core/features/favorites/flows/load/fetcher";
import { FavoritesModel } from "@/core/features/favorites/model/model";
import { FavoritesPostLibrary } from "@/core/features/favorites/flows/load/post_library";
import { FavoritesReindexer } from "@/core/features/favorites/flows/load/reindexer";
import { FavoritesReloader } from "@/core/features/favorites/flows/load/reloader";
import { LoadState } from "@/core/features/favorites/types/load";

export interface FavoritesLoadFlowDependencies extends Pick<
  FavoritesDependencies,
  "localFavorites" | "localPosts" | "localTagCategories" | "remoteFavorites" | "remotePosts" | "remoteMedia" | "scheduler"
> {
  model: FavoritesModel;
  waitForPaint: () => Promise<void>;
}

export class FavoritesLoadFlow {
  private readonly current = new Signal<LoadState>({ phase: "starting" });
  private readonly dependencies: FavoritesLoadFlowDependencies;
  private readonly fetcher: FavoritesFetcher;
  private readonly reloader: FavoritesReloader;

  constructor(dependencies: FavoritesLoadFlowDependencies) {
    const reindexer = new FavoritesReindexer(dependencies);
    const postLibrary = new FavoritesPostLibrary({ ...dependencies, onRefresh: (refreshed): void => reindexer.reindex(refreshed) });
    const pathDependencies = { ...dependencies, postLibrary, report: (state: LoadState): void => this.report(state) };

    this.dependencies = dependencies;
    this.fetcher = new FavoritesFetcher(pathDependencies);
    this.reloader = new FavoritesReloader(pathDependencies);
  }

  public get state(): Readable<LoadState> {
    return this.current;
  }

  public async load(): Promise<void> {
    const { localFavorites, model } = this.dependencies;
    const localIds = await localFavorites.getAll();

    try {
      const result = await (localIds.length > 0 ? this.reloader.reload(localIds) : this.fetcher.fetchAll());

      this.report({ phase: "loaded", ...result });
    } catch {
      this.report({ phase: "interrupted" });
    }
    model.compact();
  }

  private report(state: LoadState): void {
    this.current.value = state;
  }
}
