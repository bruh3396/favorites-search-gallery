import { Readable, Signal } from "@/core/utils/reactive/signal";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesFetcher } from "@/core/features/favorites/load/favorites_fetcher";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesReloader } from "@/core/features/favorites/load/favorites_reloader";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

const SLOW_READ_DELAY = 1_000;

export interface FavoritesLoaderDependencies {
  localFavorites: Pick<LocalFavorites, "getAll">;
  scheduler: Pick<Scheduler, "schedule">;
  favoritesCollection: Pick<FavoritesCollection, "compact">;
  favoritesFetcher: Pick<FavoritesFetcher, "fetchAll">;
  favoritesReloader: Pick<FavoritesReloader, "reload">;
}

export class FavoritesLoader {
  private readonly dependencies: FavoritesLoaderDependencies;
  readonly #state = new Signal<FavoritesLoadState>({ phase: "starting" });

  constructor(dependencies: FavoritesLoaderDependencies) {
    this.dependencies = dependencies;
  }

  public get state(): Readable<FavoritesLoadState> {
    return this.#state;
  }

  public async load(): Promise<void> {
    const { favoritesFetcher, favoritesReloader, favoritesCollection } = this.dependencies;
    const report = (favoritesLoadState: FavoritesLoadState): void => this.report(favoritesLoadState);

    try {
      const localPostIds = await this.readLocalPostIds();
      const favoritesLoadResult = await (localPostIds.length > 0 ? favoritesReloader.reload(localPostIds, report) : favoritesFetcher.fetchAll(report));

      this.report({ phase: "loaded", ...favoritesLoadResult });
    } catch {
      this.report({ phase: "interrupted" });
    }
    favoritesCollection.compact();
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
