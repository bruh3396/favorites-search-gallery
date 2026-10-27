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

  public async add(postId: string): Promise<boolean> {
    if (!this.dependencies.acceptsChanges()) {
      return false;
    }
    const isAdded = await this.dependencies.remoteFavorites.add(postId);

    if (isAdded) {
      this.getSignal(postId).value = true;
    }
    return isAdded;
  }

  public async remove(postId: string): Promise<boolean> {
    if (!this.dependencies.acceptsChanges()) {
      return false;
    }
    const isRemoved = await this.dependencies.remoteFavorites.remove(postId);

    if (isRemoved) {
      this.getSignal(postId).value = false;
      await this.dependencies.localFavorites.remove([postId]);
    }
    return isRemoved;
  }

  public isFavorited(postId: string): boolean {
    return this.getSignal(postId).value;
  }

  private getSignal(postId: string): Signal<boolean> {
    const existing = this.favorited.get(postId);

    if (existing !== undefined) {
      return existing;
    }
    const cell = new Signal(this.configuration.favoritedByDefault);

    this.favorited.set(postId, cell);
    return cell;
  }
}
