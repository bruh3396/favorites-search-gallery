import { FavoritesDependencies, FavoritesIntents } from "@/core/features/favorites/types/favorites";
import { Readable, Signal } from "@/core/utils/reactive/signal";

type ActionsIntents = Pick<FavoritesIntents, "addFavorite" | "removeFavorite">;

export type FavoritesActionsFlowDependencies = Pick<FavoritesDependencies, "remoteFavoriteActions">;

export class FavoritesActionsFlow implements ActionsIntents {
  private readonly changes = new Signal<ReadonlyMap<string, boolean>>(new Map());

  constructor(private readonly dependencies: FavoritesActionsFlowDependencies) { }

  public get favoritedChanges(): Readable<ReadonlyMap<string, boolean>> {
    return this.changes;
  }

  public async addFavorite(id: string): Promise<void> {
    await this.dependencies.remoteFavoriteActions.add(id);
  }

  public async removeFavorite(id: string): Promise<void> {
    await this.dependencies.remoteFavoriteActions.remove(id);
  }

  public recordAddition(id: string): void {
    this.changes.value = new Map(this.changes.peek()).set(id, true);
  }

  public recordRemoval(id: string): void {
    this.changes.value = new Map(this.changes.peek()).set(id, false);
  }
}
