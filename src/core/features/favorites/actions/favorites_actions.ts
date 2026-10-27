import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
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

  public async add(id: string): Promise<boolean> {
    if (!this.dependencies.acceptsChanges()) {
      return false;
    }
    const isAdded = await this.dependencies.remoteFavorites.add(id);

    if (isAdded) {
      this.getSignal(id).value = true;
    }
    return isAdded;
  }

  public async remove(id: string): Promise<boolean> {
    if (!this.dependencies.acceptsChanges()) {
      return false;
    }
    const isRemoved = await this.dependencies.remoteFavorites.remove(id);

    if (isRemoved) {
      this.getSignal(id).value = false;
      await this.dependencies.localFavorites.remove([id]);
    }
    return isRemoved;
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
