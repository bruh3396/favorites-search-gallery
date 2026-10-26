import { AddFavoriteResult, RemoteFavorites, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { Signal } from "@/core/utils/reactive/signal";

export interface FavoritesActionsConfiguration {
  readonly favoritedByDefault: boolean;
}

export interface FavoritesActionsDependencies {
  remoteFavorites: Pick<RemoteFavorites, "add" | "remove">;
  localFavorites: Pick<LocalFavorites, "remove">;
  acceptsChanges: () => boolean;
}

export class FavoritesActions {
  private readonly favorited = new Map<string, Signal<boolean>>();

  constructor(private readonly configuration: FavoritesActionsConfiguration, private readonly dependencies: FavoritesActionsDependencies) { }

  public async add(id: string): Promise<AddFavoriteResult> {
    if (!this.dependencies.acceptsChanges()) {
      return "blocked";
    }
    const result = await this.dependencies.remoteFavorites.add(id);

    if (result === "added" || result === "alreadyAdded") {
      this.getSignal(id).value = true;
    }
    return result;
  }

  public async remove(id: string): Promise<RemoveFavoriteResult> {
    if (!this.dependencies.acceptsChanges()) {
      return "blocked";
    }
    const result = await this.dependencies.remoteFavorites.remove(id);

    if (result === "removed") {
      this.getSignal(id).value = false;
      await this.dependencies.localFavorites.remove([id]);
    }
    return result;
  }

  public isFavorited(id: string): boolean {
    return this.getSignal(id).value;
  }

  private getSignal(id: string): Signal<boolean> {
    const existing = this.favorited.get(id);

    if (existing !== undefined) {
      return existing;
    }
    const cell = new Signal(this.configuration.favoritedByDefault);

    this.favorited.set(id, cell);
    return cell;
  }
}
